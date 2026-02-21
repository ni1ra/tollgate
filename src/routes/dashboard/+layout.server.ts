import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
	const session = cookies.get('tollgate_session');
	if (!session) {
		throw redirect(303, '/auth/login');
	}

	const res = await fetch('/api/v1/auth/me', {
		headers: {
			cookie: `tollgate_session=${session}`
		}
	});

	if (!res.ok) {
		throw redirect(303, '/auth/login');
	}

	const data = await res.json();

	return {
		user: data.user,
		tenant: data.tenant
	};
};
