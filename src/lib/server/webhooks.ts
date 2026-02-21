import crypto from 'crypto';
import type postgres from 'postgres';

type Sql = ReturnType<typeof postgres>;

/**
 * Fire a webhook event to all matching registered endpoints for a tenant.
 *
 * Creates a tollgate_webhook_events record per endpoint, sends the payload
 * with an HMAC-SHA256 signature, and updates delivery status.
 *
 * This is fire-and-forget — callers should NOT await the return value
 * unless they explicitly need delivery confirmation.
 */
export function fireWebhookEvent(
	sql: Sql,
	tenantId: string,
	eventType: string,
	data: Record<string, unknown>
): void {
	// Intentionally not awaited — fire and forget
	_dispatchWebhooks(sql, tenantId, eventType, data).catch(() => {
		// Swallow errors — webhook delivery failures must never crash the caller
	});
}

async function _dispatchWebhooks(
	sql: Sql,
	tenantId: string,
	eventType: string,
	data: Record<string, unknown>
): Promise<void> {
	// Find all active webhooks for this tenant that listen for this event type
	const webhooks = await sql`
		SELECT id, url, secret, events
		FROM tollgate_webhooks
		WHERE tenant_id = ${tenantId}
		  AND deleted_at IS NULL
	`;

	for (const webhook of webhooks) {
		// Check if this webhook subscribes to this event type
		const events: string[] =
			typeof webhook.events === 'string'
				? JSON.parse(webhook.events)
				: webhook.events;

		if (!events.includes('*') && !events.includes(eventType)) {
			continue;
		}

		const eventId = crypto.randomUUID();
		const createdAt = new Date().toISOString();

		const payload = JSON.stringify({
			id: eventId,
			type: eventType,
			data,
			created_at: createdAt
		});

		// Create pending event record
		await sql`
			INSERT INTO tollgate_webhook_events (id, tenant_id, webhook_id, event_type, payload, status, created_at)
			VALUES (${eventId}, ${tenantId}, ${webhook.id}, ${eventType}, ${payload}, ${'pending'}, NOW())
		`;

		// Compute HMAC-SHA256 signature
		const signature = crypto
			.createHmac('sha256', webhook.secret)
			.update(payload)
			.digest('hex');

		// Deliver — do not block other webhook deliveries on failure
		fetch(webhook.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Tollgate-Signature': signature,
				'X-Tollgate-Event': eventType
			},
			body: payload,
			signal: AbortSignal.timeout(10_000) // 10s timeout
		})
			.then(async (res) => {
				const status = res.ok ? 'delivered' : 'failed';
				const statusCode = res.status;
				await sql`
					UPDATE tollgate_webhook_events
					SET status = ${status}, status_code = ${statusCode}, delivered_at = NOW()
					WHERE id = ${eventId}
				`;
			})
			.catch(async () => {
				await sql`
					UPDATE tollgate_webhook_events
					SET status = ${'failed'}, delivered_at = NOW()
					WHERE id = ${eventId}
				`;
			});
	}
}
