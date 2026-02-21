import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');

	const res = await fetch('/api/v1/settings', {
		headers: {
			cookie: `tollgate_session=${session}`
		}
	});

	if (!res.ok) {
		return {
			settings: {
				tenant: { name: '--', slug: '--', plan: '--', created_at: '' }
			}
		};
	}

	const json = await res.json();
	return { settings: json };
};
