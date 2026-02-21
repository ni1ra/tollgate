import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

const SUPERADMIN_ROLES = ['superuser', 'superadmin'];

export const GET: RequestHandler = async ({ cookies }) => {
	const session = await validateSession(cookies);
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	if (!SUPERADMIN_ROLES.includes(session.role)) {
		return json({ error: 'Forbidden: superadmin access required' }, { status: 403 });
	}

	// Run all aggregate queries in parallel
	const [
		tenantCount,
		userCount,
		customerCount,
		subscriptionCount,
		invoiceCount,
		tenants,
		users
	] = await Promise.all([
		sql`SELECT COUNT(*)::int AS count FROM tollgate_tenants`,
		sql`SELECT COUNT(*)::int AS count FROM tollgate_users`,
		sql`SELECT COUNT(*)::int AS count FROM tollgate_customers`,
		sql`SELECT COUNT(*)::int AS count FROM tollgate_subscriptions`,
		sql`SELECT COUNT(*)::int AS count FROM tollgate_invoices`,

		// Tenants with per-tenant aggregates
		sql`
			SELECT
				t.id,
				t.name,
				t.slug,
				t.plan,
				t.created_at,
				COALESCE(u.user_count, 0)::int         AS user_count,
				COALESCE(c.customer_count, 0)::int      AS customer_count,
				COALESCE(s.mrr, 0)::numeric             AS mrr
			FROM tollgate_tenants t
			LEFT JOIN (
				SELECT tenant_id, COUNT(*) AS user_count
				FROM tollgate_users
				GROUP BY tenant_id
			) u ON u.tenant_id = t.id
			LEFT JOIN (
				SELECT tenant_id, COUNT(*) AS customer_count
				FROM tollgate_customers
				GROUP BY tenant_id
			) c ON c.tenant_id = t.id
			LEFT JOIN (
				SELECT sub.tenant_id, SUM(CASE WHEN p.interval = 'year' THEN p.amount / 12 ELSE p.amount END) AS mrr
				FROM tollgate_subscriptions sub
				JOIN tollgate_plans p ON p.id = sub.plan_id
				WHERE sub.status = 'active'
				GROUP BY sub.tenant_id
			) s ON s.tenant_id = t.id
			ORDER BY t.created_at DESC
		`,

		// All users with tenant name
		sql`
			SELECT
				u.id,
				u.email,
				u.name,
				u.role,
				u.created_at,
				t.name AS tenant_name
			FROM tollgate_users u
			JOIN tollgate_tenants t ON t.id = u.tenant_id
			ORDER BY u.created_at DESC
		`
	]);

	return json({
		stats: {
			tenants: tenantCount[0].count,
			users: userCount[0].count,
			customers: customerCount[0].count,
			subscriptions: subscriptionCount[0].count,
			invoices: invoiceCount[0].count
		},
		tenants,
		users
	});
};
