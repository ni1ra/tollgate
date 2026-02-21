import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';
import { fireWebhookEvent } from '$lib/server/webhooks';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 250);
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const status = url.searchParams.get('status');

	const subscriptions = await sql`
		SELECT
			s.id,
			s.status,
			s.quantity,
			s.current_period_start,
			s.current_period_end,
			s.cancelled_at,
			s.paused_at,
			s.created_at,
			c.id   AS customer_id,
			c.name AS customer_name,
			c.email AS customer_email,
			p.id   AS plan_id,
			p.name AS plan_name,
			p.amount AS plan_amount,
			p.currency AS plan_currency,
			p.interval AS plan_interval
		FROM tollgate_subscriptions s
		JOIN tollgate_customers c ON c.id = s.customer_id
		JOIN tollgate_plans p     ON p.id = s.plan_id
		WHERE s.tenant_id = ${user.tenantId}
		  ${status ? sql`AND s.status = ${status}` : sql``}
		ORDER BY s.created_at DESC
		LIMIT ${limit}
		OFFSET ${offset}
	`;

	return json({ data: subscriptions });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: {
		customer_id?: string;
		plan_id?: string;
		quantity?: number;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { customer_id, plan_id, quantity = 1 } = body;

	if (!customer_id || !plan_id) {
		return json({ error: 'customer_id and plan_id are required' }, { status: 400 });
	}

	// Validate customer belongs to tenant
	const [customer] = await sql`
		SELECT id, name FROM tollgate_customers
		WHERE id = ${customer_id} AND tenant_id = ${user.tenantId} AND deleted_at IS NULL
	`;
	if (!customer) {
		return json({ error: 'Customer not found' }, { status: 404 });
	}

	// Validate plan belongs to tenant and is not archived
	const [plan] = await sql`
		SELECT id, name, interval FROM tollgate_plans
		WHERE id = ${plan_id} AND tenant_id = ${user.tenantId} AND archived_at IS NULL
	`;
	if (!plan) {
		return json({ error: 'Plan not found or archived' }, { status: 404 });
	}

	const id = crypto.randomUUID();
	const now = new Date();
	const periodEnd = new Date(now);

	if (plan.interval === 'month') {
		periodEnd.setMonth(periodEnd.getMonth() + 1);
	} else {
		periodEnd.setFullYear(periodEnd.getFullYear() + 1);
	}

	const [subscription] = await sql`
		INSERT INTO tollgate_subscriptions (
			id, tenant_id, customer_id, plan_id, status, quantity,
			current_period_start, current_period_end, created_at, updated_at
		)
		VALUES (
			${id}, ${user.tenantId}, ${customer_id}, ${plan_id}, ${'active'}, ${quantity},
			${now.toISOString()}, ${periodEnd.toISOString()}, NOW(), NOW()
		)
		RETURNING *
	`;

	fireWebhookEvent(sql, user.tenantId, 'subscription.created', {
		subscription_id: id,
		customer_id,
		plan_id,
		status: 'active',
		quantity
	});

	return json({ data: subscription }, { status: 201 });
};
