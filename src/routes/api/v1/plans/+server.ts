import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const plans = await sql`
		SELECT id, name, description, type, currency, amount, interval, usage_unit, archived_at, created_at, updated_at
		FROM tollgate_plans
		WHERE tenant_id = ${user.tenantId}
		ORDER BY created_at DESC
	`;

	return json({ data: plans });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: {
		name?: string;
		description?: string;
		type?: 'flat' | 'tiered' | 'usage';
		currency?: string;
		amount?: number;
		interval?: 'month' | 'year';
		usage_unit?: string;
		tiers?: { up_to: number; unit_amount: number }[];
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { name, description, type, currency, amount, interval, usage_unit, tiers } = body;

	if (!name || !type || !interval) {
		return json({ error: 'name, type, and interval are required' }, { status: 400 });
	}

	if (!['flat', 'tiered', 'usage'].includes(type)) {
		return json({ error: 'type must be flat, tiered, or usage' }, { status: 400 });
	}

	if (!['month', 'year'].includes(interval)) {
		return json({ error: 'interval must be month or year' }, { status: 400 });
	}

	if (type === 'flat' && (amount === undefined || amount === null)) {
		return json({ error: 'amount is required for flat plans' }, { status: 400 });
	}

	if (type === 'tiered' && (!tiers || tiers.length === 0)) {
		return json({ error: 'tiers are required for tiered plans' }, { status: 400 });
	}

	if (type === 'usage' && !usage_unit) {
		return json({ error: 'usage_unit is required for usage plans' }, { status: 400 });
	}

	const planId = crypto.randomUUID();
	const planCurrency = currency || 'EUR';

	const result = await sql.begin(async (tx) => {
		const [plan] = await tx`
			INSERT INTO tollgate_plans (id, tenant_id, name, description, type, currency, amount, interval, usage_unit, created_at, updated_at)
			VALUES (
				${planId},
				${user.tenantId},
				${name},
				${description || null},
				${type},
				${planCurrency},
				${amount ?? null},
				${interval},
				${usage_unit || null},
				NOW(),
				NOW()
			)
			RETURNING *
		`;

		let insertedTiers: typeof tiers = [];

		if (type === 'tiered' && tiers && tiers.length > 0) {
			for (const tier of tiers) {
				await tx`
					INSERT INTO tollgate_plan_tiers (id, plan_id, up_to, unit_amount, created_at)
					VALUES (${crypto.randomUUID()}, ${planId}, ${tier.up_to}, ${tier.unit_amount}, NOW())
				`;
			}

			insertedTiers = tiers;
		}

		return { ...plan, tiers: insertedTiers };
	});

	return json({ data: result }, { status: 201 });
};
