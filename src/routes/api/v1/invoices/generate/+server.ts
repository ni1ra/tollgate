import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';
import { fireWebhookEvent } from '$lib/server/webhooks';

// EU VAT rates by country code
const VAT_RATES: Record<string, number> = {
	DE: 19,
	FR: 20,
	NL: 21,
	IT: 22,
	ES: 21,
	BE: 21,
	AT: 20,
	PL: 23,
	SE: 25,
	DK: 25
};
const DEFAULT_EU_VAT = 20;

function getVatRate(country: string): number {
	return VAT_RATES[country] ?? DEFAULT_EU_VAT;
}

/**
 * Calculate graduated tiered pricing.
 * Each tier covers units from the previous tier's cap to this tier's cap.
 * Example: tiers [{up_to: 10, unit_amount: 5}, {up_to: 100, unit_amount: 3}]
 *   quantity=25 => 10*5 + 15*3 = 95
 */
function calculateTieredAmount(
	tiers: { up_to: number; unit_amount: number }[],
	quantity: number
): { items: { description: string; quantity: number; unit_price: number; amount: number }[]; total: number } {
	const sorted = [...tiers].sort((a, b) => a.up_to - b.up_to);
	const items: { description: string; quantity: number; unit_price: number; amount: number }[] = [];
	let remaining = quantity;
	let prevCap = 0;
	let total = 0;

	for (const tier of sorted) {
		if (remaining <= 0) break;

		const tierCapacity = tier.up_to - prevCap;
		const tierQty = Math.min(remaining, tierCapacity);
		const amount = tierQty * tier.unit_amount;

		items.push({
			description: `Units ${prevCap + 1} - ${prevCap + tierQty} @ ${tier.unit_amount}/unit`,
			quantity: tierQty,
			unit_price: tier.unit_amount,
			amount
		});

		total += amount;
		remaining -= tierQty;
		prevCap = tier.up_to;
	}

	// If quantity exceeds all tiers, use the last tier's rate for the overflow
	if (remaining > 0 && sorted.length > 0) {
		const lastRate = sorted[sorted.length - 1].unit_amount;
		const amount = remaining * lastRate;
		items.push({
			description: `Units ${prevCap + 1}+ @ ${lastRate}/unit (overflow)`,
			quantity: remaining,
			unit_price: lastRate,
			amount
		});
		total += amount;
	}

	return { items, total };
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: { subscription_id?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { subscription_id } = body;
	if (!subscription_id) {
		return json({ error: 'subscription_id is required' }, { status: 400 });
	}

	// Fetch subscription with plan and customer
	const [subscription] = await sql`
		SELECT s.id, s.customer_id, s.plan_id, s.quantity, s.status,
		       s.current_period_start, s.current_period_end
		FROM tollgate_subscriptions s
		WHERE s.id = ${subscription_id}
		  AND s.tenant_id = ${user.tenantId}
	`;
	if (!subscription) {
		return json({ error: 'Subscription not found' }, { status: 404 });
	}

	const [plan] = await sql`
		SELECT id, name, type, currency, amount, interval, usage_unit
		FROM tollgate_plans
		WHERE id = ${subscription.plan_id}
	`;
	if (!plan) {
		return json({ error: 'Plan not found' }, { status: 404 });
	}

	const [customer] = await sql`
		SELECT id, name, email, country
		FROM tollgate_customers
		WHERE id = ${subscription.customer_id}
	`;
	if (!customer) {
		return json({ error: 'Customer not found' }, { status: 404 });
	}

	// Calculate line items based on plan type
	const lineItems: { description: string; quantity: number; unit_price: number; amount: number }[] = [];
	let subtotal = 0;

	if (plan.type === 'flat') {
		const amount = plan.amount * subscription.quantity;
		lineItems.push({
			description: `${plan.name} (${plan.interval}ly) x ${subscription.quantity}`,
			quantity: subscription.quantity,
			unit_price: plan.amount,
			amount
		});
		subtotal = amount;
	} else if (plan.type === 'tiered') {
		const tiers = await sql`
			SELECT up_to, unit_amount
			FROM tollgate_plan_tiers
			WHERE plan_id = ${plan.id}
			ORDER BY up_to ASC
		`;

		if (tiers.length === 0) {
			return json({ error: 'Tiered plan has no tier configuration' }, { status: 500 });
		}

		const result = calculateTieredAmount(
			tiers.map((t) => ({ up_to: Number(t.up_to), unit_amount: Number(t.unit_amount) })),
			subscription.quantity
		);

		lineItems.push(...result.items);
		subtotal = result.total;
	} else if (plan.type === 'usage') {
		// Sum usage records since the last invoice for this subscription,
		// or since subscription start if no prior invoice exists
		const [lastInvoice] = await sql`
			SELECT period_end FROM tollgate_invoices
			WHERE subscription_id = ${subscription_id}
			  AND tenant_id = ${user.tenantId}
			  AND status != 'void'
			ORDER BY period_end DESC
			LIMIT 1
		`;

		const sinceDate = lastInvoice?.period_end || subscription.current_period_start;

		const [usageSum] = await sql`
			SELECT COALESCE(SUM(quantity), 0) AS total_usage
			FROM tollgate_usage_records
			WHERE subscription_id = ${subscription_id}
			  AND tenant_id = ${user.tenantId}
			  AND recorded_at >= ${sinceDate}
		`;

		const totalUsage = Number(usageSum.total_usage);
		const amount = totalUsage * plan.amount;

		lineItems.push({
			description: `${plan.name}: ${totalUsage} ${plan.usage_unit || 'units'} @ ${plan.amount}/${plan.usage_unit || 'unit'}`,
			quantity: totalUsage,
			unit_price: plan.amount,
			amount
		});
		subtotal = amount;
	}

	// Calculate VAT
	const vatRate = getVatRate(customer.country);
	const vatAmount = Math.round(subtotal * vatRate) / 100;
	const total = subtotal + vatAmount;

	// Create invoice and line items in a transaction
	const invoiceId = crypto.randomUUID();
	const periodStart = subscription.current_period_start;
	const periodEnd = subscription.current_period_end;

	const result = await sql.begin(async (tx) => {
		const [invoice] = await tx`
			INSERT INTO tollgate_invoices (
				id, tenant_id, customer_id, subscription_id, status,
				subtotal, vat_rate, vat_amount, total, currency,
				period_start, period_end, created_at, updated_at
			)
			VALUES (
				${invoiceId}, ${user.tenantId}, ${customer.id}, ${subscription_id}, ${'draft'},
				${subtotal}, ${vatRate}, ${vatAmount}, ${total}, ${plan.currency},
				${periodStart}, ${periodEnd}, NOW(), NOW()
			)
			RETURNING *
		`;

		const items = [];
		for (const item of lineItems) {
			const [row] = await tx`
				INSERT INTO tollgate_invoice_items (
					id, invoice_id, description, quantity, unit_price, amount, created_at
				)
				VALUES (
					${crypto.randomUUID()}, ${invoiceId},
					${item.description}, ${item.quantity}, ${item.unit_price}, ${item.amount},
					NOW()
				)
				RETURNING *
			`;
			items.push(row);
		}

		return { ...invoice, items };
	});

	fireWebhookEvent(sql, user.tenantId, 'invoice.created', {
		invoice_id: invoiceId,
		customer_id: customer.id,
		subscription_id,
		total,
		currency: plan.currency
	});

	return json({ data: result }, { status: 201 });
};
