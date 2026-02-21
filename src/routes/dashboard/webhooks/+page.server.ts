import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');
	const headers = { cookie: `tollgate_session=${session}` };

	const [webhooksRes, eventsRes] = await Promise.all([
		fetch('/api/v1/webhooks', { headers }).catch(() => null),
		fetch('/api/v1/webhooks/events', { headers }).catch(() => null)
	]);

	let webhooks: unknown[] = [];
	let events: string[] = [];

	if (webhooksRes?.ok) {
		const json = await webhooksRes.json();
		webhooks = json.data ?? [];
	}

	if (eventsRes?.ok) {
		const json = await eventsRes.json();
		events = json.data ?? json.events ?? [];
	} else {
		// Fallback event types if endpoint not available
		events = [
			'subscription.created',
			'subscription.updated',
			'subscription.cancelled',
			'invoice.created',
			'invoice.paid',
			'invoice.void',
			'customer.created',
			'customer.updated',
			'usage.reported'
		];
	}

	return { webhooks, events };
};
