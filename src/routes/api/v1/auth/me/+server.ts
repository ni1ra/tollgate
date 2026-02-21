import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const session = await validateSession(cookies);
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Fetch full user + tenant details
	const [row] = await sql`
		SELECT
			u.id          AS user_id,
			u.email       AS email,
			u.name        AS name,
			u.role        AS role,
			u.created_at  AS user_created_at,
			t.id          AS tenant_id,
			t.name        AS tenant_name,
			t.slug        AS tenant_slug,
			t.plan        AS tenant_plan,
			t.created_at  AS tenant_created_at
		FROM tollgate_users u
		JOIN tollgate_tenants t ON t.id = u.tenant_id
		WHERE u.id = ${session.userId}
	`;

	if (!row) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	return json({
		user: {
			id: row.user_id,
			email: row.email,
			name: row.name,
			role: row.role,
			created_at: row.user_created_at
		},
		tenant: {
			id: row.tenant_id,
			name: row.tenant_name,
			slug: row.tenant_slug,
			plan: row.tenant_plan,
			created_at: row.tenant_created_at
		}
	});
};
