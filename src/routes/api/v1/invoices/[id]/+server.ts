import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';
import { fireWebhookEvent } from '$lib/server/webhooks';

export const GET: RequestHandler = async ({ cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const [invoice] = await sql`
		SELECT
			i.id, i.status, i.subtotal, i.vat_rate, i.vat_amount, i.total, i.currency,
			i.period_start, i.period_end, i.created_at, i.updated_at,
			c.id AS customer_id, c.name AS customer_name, c.email AS customer_email, c.country AS customer_country,
			s.id AS subscription_id,
			p.name AS plan_name
		FROM tollgate_invoices i
		JOIN tollgate_customers c          ON c.id = i.customer_id
		LEFT JOIN tollgate_subscriptions s ON s.id = i.subscription_id
		LEFT JOIN tollgate_plans p         ON p.id = s.plan_id
		WHERE i.id = ${params.id}
		  AND i.tenant_id = ${user.tenantId}
	`;

	if (!invoice) {
		return json({ error: 'Invoice not found' }, { status: 404 });
	}

	const items = await sql`
		SELECT id, description, quantity, unit_price, amount
		FROM tollgate_invoice_items
		WHERE invoice_id = ${params.id}
		ORDER BY created_at ASC
	`;

	return json({
		data: {
			...invoice,
			items
		}
	});
};

export const PATCH: RequestHandler = async ({ request, cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: { status?: 'finalized' | 'paid' | 'void' };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!body.status) {
		return json({ error: 'status is required' }, { status: 400 });
	}

	if (!['finalized', 'paid', 'void'].includes(body.status)) {
		return json({ error: 'status must be finalized, paid, or void' }, { status: 400 });
	}

	const [existing] = await sql`
		SELECT id, status, customer_id, subscription_id FROM tollgate_invoices
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId}
	`;
	if (!existing) {
		return json({ error: 'Invoice not found' }, { status: 404 });
	}

	// Validate status transitions
	const validTransitions: Record<string, string[]> = {
		draft: ['finalized', 'void'],
		finalized: ['paid', 'void'],
		paid: [],
		void: []
	};

	if (!validTransitions[existing.status]?.includes(body.status)) {
		return json(
			{ error: `Cannot transition from '${existing.status}' to '${body.status}'` },
			{ status: 409 }
		);
	}

	const [updated] = await sql`
		UPDATE tollgate_invoices
		SET status = ${body.status}, updated_at = NOW()
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId}
		RETURNING *
	`;

	// Fire webhook based on new status
	if (body.status === 'finalized') {
		fireWebhookEvent(sql, user.tenantId, 'invoice.finalized', {
			invoice_id: params.id,
			customer_id: existing.customer_id,
			subscription_id: existing.subscription_id
		});
	} else if (body.status === 'paid') {
		fireWebhookEvent(sql, user.tenantId, 'invoice.paid', {
			invoice_id: params.id,
			customer_id: existing.customer_id,
			subscription_id: existing.subscription_id
		});
	}

	return json({ data: updated });
};
