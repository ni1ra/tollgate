import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const [plan] = await sql`
		SELECT id, name, description, type, currency, amount, interval, usage_unit, archived_at, created_at, updated_at
		FROM tollgate_plans
		WHERE id = ${params.id}
		  AND tenant_id = ${user.tenantId}
	`;

	if (!plan) {
		return json({ error: 'Plan not found' }, { status: 404 });
	}

	const tiers = await sql`
		SELECT id, up_to, unit_amount
		FROM tollgate_plan_tiers
		WHERE plan_id = ${params.id}
		ORDER BY up_to ASC
	`;

	return json({ data: { ...plan, tiers } });
};

export const PATCH: RequestHandler = async ({ request, cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: {
		name?: string;
		description?: string | null;
		amount?: number;
		usage_unit?: string;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const [existing] = await sql`
		SELECT id FROM tollgate_plans
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId}
	`;
	if (!existing) {
		return json({ error: 'Plan not found' }, { status: 404 });
	}

	const [updated] = await sql`
		UPDATE tollgate_plans SET
			name        = COALESCE(${body.name ?? null}, name),
			description = COALESCE(${body.description !== undefined ? body.description : null}, description),
			amount      = COALESCE(${body.amount ?? null}, amount),
			usage_unit  = COALESCE(${body.usage_unit ?? null}, usage_unit),
			updated_at  = NOW()
		WHERE id = ${params.id}
		  AND tenant_id = ${user.tenantId}
		RETURNING *
	`;

	return json({ data: updated });
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const [existing] = await sql`
		SELECT id, archived_at FROM tollgate_plans
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId}
	`;
	if (!existing) {
		return json({ error: 'Plan not found' }, { status: 404 });
	}

	if (existing.archived_at) {
		return json({ error: 'Plan is already archived' }, { status: 409 });
	}

	await sql`
		UPDATE tollgate_plans
		SET archived_at = NOW(), updated_at = NOW()
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId}
	`;

	return json({ data: { id: params.id, archived: true } });
};
