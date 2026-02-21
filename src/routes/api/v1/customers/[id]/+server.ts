import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const [customer] = await sql`
		SELECT id, name, email, country, vat_id, metadata, created_at, updated_at
		FROM tollgate_customers
		WHERE id = ${params.id}
		  AND tenant_id = ${user.tenantId}
		  AND deleted_at IS NULL
	`;

	if (!customer) {
		return json({ error: 'Customer not found' }, { status: 404 });
	}

	const subscriptions = await sql`
		SELECT s.id, s.status, s.quantity, s.current_period_start, s.current_period_end, s.created_at,
		       p.name AS plan_name, p.amount, p.currency, p.interval
		FROM tollgate_subscriptions s
		JOIN tollgate_plans p ON p.id = s.plan_id
		WHERE s.customer_id = ${params.id}
		  AND s.tenant_id = ${user.tenantId}
		ORDER BY s.created_at DESC
	`;

	const invoices = await sql`
		SELECT id, status, subtotal, vat_rate, vat_amount, total, currency, period_start, period_end, created_at
		FROM tollgate_invoices
		WHERE customer_id = ${params.id}
		  AND tenant_id = ${user.tenantId}
		ORDER BY created_at DESC
		LIMIT 20
	`;

	return json({
		data: {
			...customer,
			subscriptions,
			invoices
		}
	});
};

export const PATCH: RequestHandler = async ({ request, cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: {
		name?: string;
		email?: string;
		country?: string;
		vat_id?: string | null;
		metadata?: Record<string, unknown>;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (body.country && !/^[A-Z]{2}$/.test(body.country)) {
		return json({ error: 'country must be a 2-letter ISO code' }, { status: 400 });
	}

	// Build update fields dynamically
	const [existing] = await sql`
		SELECT id FROM tollgate_customers
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId} AND deleted_at IS NULL
	`;
	if (!existing) {
		return json({ error: 'Customer not found' }, { status: 404 });
	}

	const [updated] = await sql`
		UPDATE tollgate_customers SET
			name       = COALESCE(${body.name ?? null}, name),
			email      = COALESCE(${body.email ?? null}, email),
			country    = COALESCE(${body.country ?? null}, country),
			vat_id     = ${body.vat_id !== undefined ? body.vat_id : null},
			metadata   = COALESCE(${body.metadata ? JSON.stringify(body.metadata) : null}, metadata),
			updated_at = NOW()
		WHERE id = ${params.id}
		  AND tenant_id = ${user.tenantId}
		RETURNING *
	`;

	return json({ data: updated });
};
