import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 250);
	const offset = parseInt(url.searchParams.get('offset') || '0');
	const webhookId = url.searchParams.get('webhook_id');
	const eventType = url.searchParams.get('event_type');
	const status = url.searchParams.get('status');

	const events = await sql`
		SELECT
			e.id,
			e.webhook_id,
			e.event_type,
			e.payload,
			e.status,
			e.status_code,
			e.created_at,
			e.delivered_at,
			w.url AS webhook_url
		FROM tollgate_webhook_events e
		JOIN tollgate_webhooks w ON w.id = e.webhook_id
		WHERE e.tenant_id = ${user.tenantId}
		  ${webhookId ? sql`AND e.webhook_id = ${webhookId}` : sql``}
		  ${eventType ? sql`AND e.event_type = ${eventType}` : sql``}
		  ${status ? sql`AND e.status = ${status}` : sql``}
		ORDER BY e.created_at DESC
		LIMIT ${limit}
		OFFSET ${offset}
	`;

	return json({ data: events });
};
