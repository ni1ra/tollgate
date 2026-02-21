import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const [existing] = await sql`
		SELECT id FROM tollgate_webhooks
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId} AND deleted_at IS NULL
	`;
	if (!existing) {
		return json({ error: 'Webhook not found' }, { status: 404 });
	}

	await sql`
		UPDATE tollgate_webhooks
		SET deleted_at = NOW()
		WHERE id = ${params.id} AND tenant_id = ${user.tenantId}
	`;

	return json({ data: { id: params.id, deleted: true } });
};
