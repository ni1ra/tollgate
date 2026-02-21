import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');

	const res = await fetch('/api/v1/analytics/overview', {
		headers: {
			cookie: `tollgate_session=${session}`
		}
	});

	if (!res.ok) {
		return {
			overview: {
				mrr: 0,
				active_subscriptions: 0,
				total_customers: 0,
				total_invoiced: 0,
				churn_rate: 0,
				revenue_trend: []
			}
		};
	}

	const overview = await res.json();
	return { overview };
};
