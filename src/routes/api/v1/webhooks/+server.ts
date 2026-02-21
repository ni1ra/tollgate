import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import crypto from 'crypto';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const webhooks = await sql`
		SELECT id, url, events, created_at
		FROM tollgate_webhooks
		WHERE tenant_id = ${user.tenantId}
		  AND deleted_at IS NULL
		ORDER BY created_at DESC
	`;

	return json({ data: webhooks });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: {
		url?: string;
		events?: string[];
		secret?: string;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { url, events, secret } = body;

	if (!url || !events || events.length === 0) {
		return json({ error: 'url and events are required' }, { status: 400 });
	}

	// Basic URL validation
	try {
		new URL(url);
	} catch {
		return json({ error: 'url must be a valid URL' }, { status: 400 });
	}

	const id = crypto.randomUUID();
	const signingSecret = secret || crypto.randomBytes(32).toString('hex');

	const [webhook] = await sql`
		INSERT INTO tollgate_webhooks (id, tenant_id, url, events, secret, created_at)
		VALUES (${id}, ${user.tenantId}, ${url}, ${sql.array(events || [])}, ${signingSecret}, NOW())
		RETURNING id, url, events, created_at
	`;

	return json(
		{
			data: {
				...webhook,
				secret: signingSecret
			}
		},
		{ status: 201 }
	);
};
