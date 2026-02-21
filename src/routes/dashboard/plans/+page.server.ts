import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');

	const res = await fetch('/api/v1/plans', {
		headers: {
			cookie: `tollgate_session=${session}`
		}
	});

	if (!res.ok) {
		return { plans: [] };
	}

	const json = await res.json();
	return { plans: json.data ?? [] };
};
