import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import {
	verifyPassword,
	generateId,
	bruteForceCheck,
	recordFailedAttempt
} from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const ip = getClientAddress();

	if (bruteForceCheck(ip)) {
		return json(
			{ error: 'Too many login attempts. Try again in 15 minutes.' },
			{ status: 429 }
		);
	}

	let body: { email?: string; password?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { email, password } = body;

	if (!email || !password) {
		return json({ error: 'email and password are required' }, { status: 400 });
	}

	// Look up user with tenant info
	const [row] = await sql`
		SELECT
			u.id            AS user_id,
			u.email         AS email,
			u.password_hash AS password_hash,
			u.name          AS name,
			u.role          AS role,
			t.id            AS tenant_id,
			t.name          AS tenant_name,
			t.slug          AS tenant_slug
		FROM tollgate_users u
		JOIN tollgate_tenants t ON t.id = u.tenant_id
		WHERE u.email = ${email}
	`;

	if (!row) {
		recordFailedAttempt(ip);
		return json({ error: 'Invalid email or password' }, { status: 401 });
	}

	const valid = await verifyPassword(password, row.password_hash);
	if (!valid) {
		recordFailedAttempt(ip);
		return json({ error: 'Invalid email or password' }, { status: 401 });
	}

	// Create session — 30 days
	const sessionId = generateId();
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

	await sql`
		INSERT INTO tollgate_sessions (id, user_id, tenant_id, expires_at)
		VALUES (${sessionId}, ${row.user_id}, ${row.tenant_id}, ${expiresAt})
	`;

	cookies.set('tollgate_session', sessionId, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 30 * 24 * 60 * 60
	});

	return json({
		user: { email: row.email, name: row.name, role: row.role },
		tenant: { name: row.tenant_name, slug: row.tenant_slug }
	});
};
