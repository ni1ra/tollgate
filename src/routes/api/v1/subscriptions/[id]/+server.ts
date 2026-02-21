import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';
import { fireWebhookEvent } from '$lib/server/webhooks';

export const GET: RequestHandler = async ({ cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const [subscription] = await sql`
		SELECT
			s.id, s.status, s.quantity, s.current_period_start, s.current_period_end,
			s.cancelled_at, s.paused_at, s.created_at, s.updated_at
		FROM tollgate_subscriptions s
		WHERE s.id = ${params.id}
		  AND s.tenant_id = ${user.tenantId}
	`;

	if (!subscription) {
		return json({ error: 'Subscription not found' }, { status: 404 });
	}

	const [customer] = await sql`
		SELECT id, name, email, country
		FROM tollgate_customers
		WHERE id = (SELECT customer_id FROM tollgate_subscriptions WHERE id = ${params.id})
	`;

	const [plan] = await sql`
		SELECT id, name, type, currency, amount, interval, usage_unit
		FROM tollgate_plans
		WHERE id = (SELECT plan_id FROM tollgate_subscriptions WHERE id = ${params.id})
	`;

	const invoices = await sql`
		SELECT id, status, subtotal, vat_rate, vat_amount, total, currency, period_start, period_end, created_at
		FROM tollgate_invoices
		WHERE subscription_id = ${params.id}
		  AND tenant_id = ${user.tenantId}
		ORDER BY created_at DESC
		LIMIT 20
	`;

	return json({
		data: {
			...subscription,
			customer,
			plan,
			invoices
		}
	});
};

export const PATCH: RequestHandler = async ({ request, cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: {
		status?: 'active' | 'paused' | 'cancelled';
		plan_id?: string;
		quantity?: number;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const [existing] = await sql`
		SELECT id, status, plan_id, quantity, customer_id
		FROM tollgate_subscriptions
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId}
	`;
	if (!existing) {
		return json({ error: 'Subscription not found' }, { status: 404 });
	}

	// If changing plan, validate the new plan belongs to tenant
	if (body.plan_id && body.plan_id !== existing.plan_id) {
		const [newPlan] = await sql`
			SELECT id, interval FROM tollgate_plans
			WHERE id = ${body.plan_id} AND tenant_id = ${user.tenantId} AND archived_at IS NULL
		`;
		if (!newPlan) {
			return json({ error: 'New plan not found or archived' }, { status: 404 });
		}
	}

	// Build update
	const now = new Date();
	const cancelledAt = body.status === 'cancelled' ? now.toISOString() : null;
	const pausedAt = body.status === 'paused' ? now.toISOString() : null;

	const [updated] = await sql`
		UPDATE tollgate_subscriptions SET
			status     = COALESCE(${body.status ?? null}, status),
			plan_id    = COALESCE(${body.plan_id ?? null}, plan_id),
			quantity   = COALESCE(${body.quantity ?? null}, quantity),
			cancelled_at = ${body.status === 'cancelled' ? cancelledAt : sql`cancelled_at`},
			paused_at    = ${body.status === 'paused' ? pausedAt : sql`paused_at`},
			updated_at = NOW()
		WHERE id = ${params.id}
		  AND tenant_id = ${user.tenantId}
		RETURNING *
	`;

	// Fire appropriate webhook event
	if (body.status === 'cancelled') {
		fireWebhookEvent(sql, user.tenantId, 'subscription.cancelled', {
			subscription_id: params.id,
			customer_id: existing.customer_id,
			cancelled_at: cancelledAt
		});
	} else {
		fireWebhookEvent(sql, user.tenantId, 'subscription.updated', {
			subscription_id: params.id,
			changes: body
		});
	}

	return json({ data: updated });
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const [existing] = await sql`
		SELECT id, customer_id FROM tollgate_subscriptions
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId}
	`;
	if (!existing) {
		return json({ error: 'Subscription not found' }, { status: 404 });
	}

	const now = new Date().toISOString();

	await sql`
		UPDATE tollgate_subscriptions
		SET status = ${'cancelled'}, cancelled_at = ${now}, updated_at = NOW()
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId}
	`;

	fireWebhookEvent(sql, user.tenantId, 'subscription.cancelled', {
		subscription_id: params.id,
		customer_id: existing.customer_id,
		cancelled_at: now
	});

	return json({ data: { id: params.id, status: 'cancelled', cancelled_at: now } });
};
