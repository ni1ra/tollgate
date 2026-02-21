import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession, generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const session = await validateSession(cookies);
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	let body: { customer_id?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { customer_id } = body;

	if (!customer_id) {
		return json({ error: 'customer_id is required' }, { status: 400 });
	}

	const tenantId = session.tenantId;

	// Verify customer belongs to this tenant
	const [customer] = await sql`
		SELECT id FROM tollgate_customers
		WHERE id = ${customer_id} AND tenant_id = ${tenantId}
	`;

	if (!customer) {
		return json({ error: 'Customer not found' }, { status: 404 });
	}

	// Delete in FK-safe order within a transaction
	await sql.begin(async (tx) => {
		// 1. Usage records
		await tx`
			DELETE FROM tollgate_usage_records
			WHERE customer_id = ${customer_id} AND tenant_id = ${tenantId}
		`;

		// 2. Invoice items (via invoices belonging to this customer)
		await tx`
			DELETE FROM tollgate_invoice_items
			WHERE invoice_id IN (
				SELECT id FROM tollgate_invoices
				WHERE customer_id = ${customer_id} AND tenant_id = ${tenantId}
			)
		`;

		// 3. Invoices
		await tx`
			DELETE FROM tollgate_invoices
			WHERE customer_id = ${customer_id} AND tenant_id = ${tenantId}
		`;

		// 4. Subscriptions
		await tx`
			DELETE FROM tollgate_subscriptions
			WHERE customer_id = ${customer_id} AND tenant_id = ${tenantId}
		`;

		// 5. Customer
		await tx`
			DELETE FROM tollgate_customers
			WHERE id = ${customer_id} AND tenant_id = ${tenantId}
		`;

		// Audit log
		await tx`
			INSERT INTO tollgate_audit_log (id, tenant_id, actor_id, action, entity_type, entity_id, created_at)
			VALUES (${generateId()}, ${tenantId}, ${session.userId}, ${'gdpr_delete'}, ${'customer'}, ${customer_id}, NOW())
		`;
	});

	return json({
		deleted: true,
		customer_id
	});
};
