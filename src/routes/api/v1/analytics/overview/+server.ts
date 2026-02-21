import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const session = await validateSession(cookies);
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const tenantId = session.tenantId;

	// MRR: sum of active subscriptions' plan amounts, normalised to monthly
	const [mrrRow] = await sql`
		SELECT COALESCE(SUM(
			CASE
				WHEN p.billing_interval = 'yearly' THEN p.amount / 12
				ELSE p.amount
			END
		), 0) AS mrr
		FROM tollgate_subscriptions s
		JOIN tollgate_plans p ON p.id = s.plan_id
		WHERE s.tenant_id = ${tenantId}
		  AND s.status = 'active'
	`;

	// Active subscriptions count
	const [activeRow] = await sql`
		SELECT COUNT(*)::int AS count
		FROM tollgate_subscriptions
		WHERE tenant_id = ${tenantId}
		  AND status = 'active'
	`;

	// Total customers
	const [customerRow] = await sql`
		SELECT COUNT(*)::int AS count
		FROM tollgate_customers
		WHERE tenant_id = ${tenantId}
	`;

	// Total invoiced amount (paid invoices)
	const [invoicedRow] = await sql`
		SELECT COALESCE(SUM(total), 0) AS total
		FROM tollgate_invoices
		WHERE tenant_id = ${tenantId}
		  AND status = 'paid'
	`;

	// Churn rate: cancelled in last 30 days / total active 30 days ago
	const [cancelledRow] = await sql`
		SELECT COUNT(*)::int AS count
		FROM tollgate_subscriptions
		WHERE tenant_id = ${tenantId}
		  AND status = 'cancelled'
		  AND cancelled_at >= NOW() - INTERVAL '30 days'
	`;

	const [activeThirtyDaysAgoRow] = await sql`
		SELECT COUNT(*)::int AS count
		FROM tollgate_subscriptions
		WHERE tenant_id = ${tenantId}
		  AND created_at <= NOW() - INTERVAL '30 days'
		  AND (
			status = 'active'
			OR (status = 'cancelled' AND cancelled_at >= NOW() - INTERVAL '30 days')
		  )
	`;

	const churnDenominator = activeThirtyDaysAgoRow.count || 0;
	const churnRate = churnDenominator > 0
		? Math.round((cancelledRow.count / churnDenominator) * 10000) / 10000
		: 0;

	// Revenue trend: last 6 months of paid invoice totals grouped by month
	const revenueTrend = await sql`
		SELECT
			TO_CHAR(DATE_TRUNC('month', paid_at), 'YYYY-MM') AS month,
			COALESCE(SUM(total), 0) AS amount
		FROM tollgate_invoices
		WHERE tenant_id = ${tenantId}
		  AND status = 'paid'
		  AND paid_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
		GROUP BY DATE_TRUNC('month', paid_at)
		ORDER BY DATE_TRUNC('month', paid_at) ASC
	`;

	return json({
		mrr: Number(mrrRow.mrr),
		active_subscriptions: activeRow.count,
		total_customers: customerRow.count,
		total_invoiced: Number(invoicedRow.total),
		churn_rate: churnRate,
		revenue_trend: revenueTrend.map((r) => ({
			month: r.month,
			amount: Number(r.amount)
		}))
	});
};
