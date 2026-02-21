import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const session = await validateSession(cookies);
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const [tenant] = await sql`
		SELECT name, slug, plan, created_at
		FROM tollgate_tenants
		WHERE id = ${session.tenantId}
	`;

	if (!tenant) {
		return json({ error: 'Tenant not found' }, { status: 404 });
	}

	return json({
		tenant: {
			name: tenant.name,
			slug: tenant.slug,
			plan: tenant.plan,
			created_at: tenant.created_at
		}
	});
};
