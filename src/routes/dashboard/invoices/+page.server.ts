import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');
	const headers = { cookie: `tollgate_session=${session}` };

	const [invRes, subsRes] = await Promise.all([
		fetch('/api/v1/invoices', { headers }),
		fetch('/api/v1/subscriptions', { headers })
	]);

	const [invJson, subsJson] = await Promise.all([
		invRes.ok ? invRes.json() : { data: [] },
		subsRes.ok ? subsRes.json() : { data: [] }
	]);

	return {
		invoices: invJson.data ?? [],
		subscriptions: subsJson.data ?? []
	};
};
