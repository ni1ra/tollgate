import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');

	const res = await fetch('/api/v1/admin/overview', {
		headers: {
			cookie: `tollgate_session=${session}`
		}
	});

	if (!res.ok) {
		const status = res.status;
		return {
			authorized: status !== 403,
			error: status === 403 ? 'forbidden' : 'error',
			admin: {
				stats: { tenants: 0, users: 0, customers: 0, subscriptions: 0, invoices: 0 },
				tenants: [],
				users: []
			}
		};
	}

	const json = await res.json();
	return {
		authorized: true,
		error: null,
		admin: json
	};
};
