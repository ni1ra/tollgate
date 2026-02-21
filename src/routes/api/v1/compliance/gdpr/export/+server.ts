import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const session = await validateSession(cookies);
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const userId = url.searchParams.get('user_id');
	return await handleExport(session.tenantId, session.userId, userId);
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const session = await validateSession(cookies);
	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	let body: { user_id?: string };
	try {
		body = await request.json();
	} catch {
		body = {};
	}

	return await handleExport(session.tenantId, session.userId, body.user_id ?? null);
};

async function handleExport(
	tenantId: string,
	actorId: string,
	customerId: string | null
) {
	if (customerId) {
		// Export all billing data for a specific customer
		const [customer] = await sql`
			SELECT * FROM tollgate_customers
			WHERE id = ${customerId} AND tenant_id = ${tenantId}
		`;

		if (!customer) {
			return json({ error: 'Customer not found' }, { status: 404 });
		}

		const subscriptions = await sql`
			SELECT * FROM tollgate_subscriptions
			WHERE customer_id = ${customerId} AND tenant_id = ${tenantId}
			ORDER BY created_at DESC
		`;

		const invoices = await sql`
			SELECT * FROM tollgate_invoices
			WHERE customer_id = ${customerId} AND tenant_id = ${tenantId}
			ORDER BY created_at DESC
		`;

		const subIds = subscriptions.map((s: { id: string }) => s.id);
		const usageRecords = subIds.length > 0
			? await sql`
				SELECT * FROM tollgate_usage_records
				WHERE subscription_id = ANY(${sql.array(subIds)}) AND tenant_id = ${tenantId}
				ORDER BY recorded_at DESC
			`
			: [];

		// Audit log
		await sql`
			INSERT INTO tollgate_audit_log (id, tenant_id, user_id, action, entity_type, entity_id, created_at)
			VALUES (${crypto.randomUUID()}, ${tenantId}, ${actorId}, ${'gdpr_export'}, ${'customer'}, ${customerId}, NOW())
		`;

		return json({
			type: 'customer_export',
			customer,
			subscriptions,
			invoices,
			usage_records: usageRecords,
			exported_at: new Date().toISOString()
		});
	}

	// Tenant summary export
	const [customerCount] = await sql`
		SELECT COUNT(*)::int AS count FROM tollgate_customers
		WHERE tenant_id = ${tenantId}
	`;

	const [subscriptionCount] = await sql`
		SELECT COUNT(*)::int AS count FROM tollgate_subscriptions
		WHERE tenant_id = ${tenantId}
	`;

	const [invoiceCount] = await sql`
		SELECT COUNT(*)::int AS count FROM tollgate_invoices
		WHERE tenant_id = ${tenantId}
	`;

	const [revenueRow] = await sql`
		SELECT COALESCE(SUM(total), 0) AS total FROM tollgate_invoices
		WHERE tenant_id = ${tenantId} AND status = 'paid'
	`;

	// Audit log
	await sql`
		INSERT INTO tollgate_audit_log (id, tenant_id, user_id, action, entity_type, entity_id, created_at)
		VALUES (${crypto.randomUUID()}, ${tenantId}, ${actorId}, ${'gdpr_export'}, ${'tenant'}, ${tenantId}, NOW())
	`;

	return json({
		type: 'tenant_summary',
		customer_count: customerCount.count,
		subscription_count: subscriptionCount.count,
		invoice_count: invoiceCount.count,
		total_revenue: Number(revenueRow.total),
		exported_at: new Date().toISOString()
	});
}
