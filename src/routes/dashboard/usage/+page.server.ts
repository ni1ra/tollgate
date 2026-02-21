import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');
	const headers = { cookie: `tollgate_session=${session}` };

	// Fetch subscriptions for dropdown
	const subsRes = await fetch('/api/v1/subscriptions', { headers });
	const subsJson = subsRes.ok ? await subsRes.json() : { data: [] };
	const subscriptions = subsJson.data ?? [];

	// Fetch usage for first subscription if available (or empty)
	let usage: unknown[] = [];
	if (subscriptions.length > 0) {
		const usageRes = await fetch(
			`/api/v1/usage?subscription_id=${subscriptions[0].id}`,
			{ headers }
		);
		if (usageRes.ok) {
			const usageJson = await usageRes.json();
			usage = usageJson.data ?? [];
		}
	}

	return { usage, subscriptions };
};
