import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';
import { fireWebhookEvent } from '$lib/server/webhooks';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const subscriptionId = url.searchParams.get('subscription_id');
	if (!subscriptionId) {
		return json({ error: 'subscription_id query parameter is required' }, { status: 400 });
	}

	// Validate subscription belongs to tenant
	const [sub] = await sql`
		SELECT id FROM tollgate_subscriptions
		WHERE id = ${subscriptionId} AND tenant_id = ${user.tenantId}
	`;
	if (!sub) {
		return json({ error: 'Subscription not found' }, { status: 404 });
	}

	const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
	const offset = parseInt(url.searchParams.get('offset') || '0');

	const records = await sql`
		SELECT id, subscription_id, quantity, recorded_at, description, created_at
		FROM tollgate_usage_records
		WHERE subscription_id = ${subscriptionId}
		  AND tenant_id = ${user.tenantId}
		ORDER BY recorded_at DESC
		LIMIT ${limit}
		OFFSET ${offset}
	`;

	return json({ data: records });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: {
		subscription_id?: string;
		quantity?: number;
		recorded_at?: string;
		description?: string;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { subscription_id, quantity, recorded_at, description } = body;

	if (!subscription_id || quantity === undefined || quantity === null) {
		return json({ error: 'subscription_id and quantity are required' }, { status: 400 });
	}

	if (typeof quantity !== 'number' || quantity < 0) {
		return json({ error: 'quantity must be a non-negative number' }, { status: 400 });
	}

	// Validate subscription belongs to tenant
	const [sub] = await sql`
		SELECT id, customer_id, plan_id FROM tollgate_subscriptions
		WHERE id = ${subscription_id} AND tenant_id = ${user.tenantId}
	`;
	if (!sub) {
		return json({ error: 'Subscription not found' }, { status: 404 });
	}

	const id = crypto.randomUUID();
	const ts = recorded_at || new Date().toISOString();

	const [record] = await sql`
		INSERT INTO tollgate_usage_records (id, tenant_id, subscription_id, quantity, recorded_at, description, created_at)
		VALUES (${id}, ${user.tenantId}, ${subscription_id}, ${quantity}, ${ts}, ${description || null}, NOW())
		RETURNING *
	`;

	fireWebhookEvent(sql, user.tenantId, 'usage.reported', {
		usage_record_id: id,
		subscription_id,
		quantity,
		recorded_at: ts
	});

	return json({ data: record }, { status: 201 });
};
