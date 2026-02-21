import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 250);
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const status = url.searchParams.get('status');
	const customerId = url.searchParams.get('customer_id');

	const invoices = await sql`
		SELECT
			i.id,
			i.status,
			i.subtotal,
			i.vat_rate,
			i.vat_amount,
			i.total,
			i.currency,
			i.period_start,
			i.period_end,
			i.created_at,
			c.id   AS customer_id,
			c.name AS customer_name,
			c.email AS customer_email,
			s.id   AS subscription_id,
			p.name AS plan_name
		FROM tollgate_invoices i
		JOIN tollgate_customers c     ON c.id = i.customer_id
		LEFT JOIN tollgate_subscriptions s ON s.id = i.subscription_id
		LEFT JOIN tollgate_plans p         ON p.id = s.plan_id
		WHERE i.tenant_id = ${user.tenantId}
		  ${status ? sql`AND i.status = ${status}` : sql``}
		  ${customerId ? sql`AND i.customer_id = ${customerId}` : sql``}
		ORDER BY i.created_at DESC
		LIMIT ${limit}
		OFFSET ${offset}
	`;

	return json({ data: invoices });
};
