import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');
	const headers = { cookie: `tollgate_session=${session}` };

	const [subsRes, custRes, plansRes] = await Promise.all([
		fetch('/api/v1/subscriptions', { headers }),
		fetch('/api/v1/customers', { headers }),
		fetch('/api/v1/plans', { headers })
	]);

	const [subsJson, custJson, plansJson] = await Promise.all([
		subsRes.ok ? subsRes.json() : { data: [] },
		custRes.ok ? custRes.json() : { data: [] },
		plansRes.ok ? plansRes.json() : { data: [] }
	]);

	return {
		subscriptions: subsJson.data ?? [],
		customers: custJson.data ?? [],
		plans: plansJson.data ?? []
	};
};
