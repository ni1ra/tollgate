import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import crypto from 'crypto';
import sql from '$lib/server/db';
import { hashPassword, generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: { email?: string; password?: string; name?: string; org_name?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { email, password, name, org_name } = body;

	if (!email || !password || !name || !org_name) {
		return json({ error: 'email, password, name, and org_name are required' }, { status: 400 });
	}

	if (password.length < 8) {
		return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
	}

	// Slugify org name: lowercase, replace non-alphanumeric runs with hyphens, trim
	const slug = org_name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

	if (!slug) {
		return json({ error: 'org_name must contain at least one alphanumeric character' }, { status: 400 });
	}

	// Check for existing user or tenant slug
	const [existingUser] = await sql`
		SELECT id FROM tollgate_users WHERE email = ${email}
	`;
	if (existingUser) {
		return json({ error: 'Email already registered' }, { status: 409 });
	}

	const [existingTenant] = await sql`
		SELECT id FROM tollgate_tenants WHERE slug = ${slug}
	`;
	if (existingTenant) {
		return json({ error: 'Organisation name already taken' }, { status: 409 });
	}

	// Create everything in a transaction
	const tenantId = generateId();
	const userId = generateId();
	const sessionId = generateId();
	const apiKeyId = generateId();
	const passwordHash = await hashPassword(password);

	// Generate API key: raw key shown once, SHA-256 hash stored
	const rawApiKey = crypto.randomBytes(32).toString('hex');
	const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
	const keyPrefix = rawApiKey.slice(0, 8);

	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

	await sql.begin(async (tx) => {
		await tx`
			INSERT INTO tollgate_tenants (id, name, slug, plan, created_at)
			VALUES (${tenantId}, ${org_name}, ${slug}, ${'free'}, NOW())
		`;

		await tx`
			INSERT INTO tollgate_users (id, email, password_hash, name, role, tenant_id, created_at)
			VALUES (${userId}, ${email}, ${passwordHash}, ${name}, ${'owner'}, ${tenantId}, NOW())
		`;

		await tx`
			INSERT INTO tollgate_api_keys (id, tenant_id, name, key_hash, key_prefix, created_at)
			VALUES (${apiKeyId}, ${tenantId}, ${'Default'}, ${keyHash}, ${keyPrefix}, NOW())
		`;

		await tx`
			INSERT INTO tollgate_sessions (id, user_id, tenant_id, expires_at)
			VALUES (${sessionId}, ${userId}, ${tenantId}, ${expiresAt})
		`;
	});

	// Set session cookie — 30 days
	cookies.set('tollgate_session', sessionId, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 30 * 24 * 60 * 60
	});

	return json({
		user: { email, name, role: 'owner' },
		tenant: { name: org_name, slug, plan: 'free' },
		api_key: rawApiKey
	});
};
