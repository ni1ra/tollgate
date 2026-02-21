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

	// Break down MRR by plan
	const plans = await sql`
		SELECT
			p.name                     AS plan_name,
			p.type                     AS plan_type,
			COUNT(s.id)::int           AS subscribers,
			COALESCE(SUM(
				CASE
					WHEN p.interval = 'year' THEN p.amount / 12
					ELSE p.amount
				END
			), 0) AS mrr
		FROM tollgate_plans p
		LEFT JOIN tollgate_subscriptions s
			ON s.plan_id = p.id
			AND s.status = 'active'
			AND s.tenant_id = ${tenantId}
		WHERE p.tenant_id = ${tenantId}
		GROUP BY p.id, p.name, p.type
		ORDER BY mrr DESC
	`;

	const totalMrr = plans.reduce((sum, p) => sum + Number(p.mrr), 0);

	return json({
		total_mrr: totalMrr,
		plans: plans.map((p) => ({
			plan_name: p.plan_name,
			plan_type: p.plan_type,
			subscribers: p.subscribers,
			mrr: Number(p.mrr)
		}))
	});
};
