import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');

	const res = await fetch('/api/v1/customers', {
		headers: {
			cookie: `tollgate_session=${session}`
		}
	});

	if (!res.ok) {
		return { customers: [] };
	}

	const json = await res.json();
	return { customers: json.data ?? [] };
};
