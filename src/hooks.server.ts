import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Allow API routes and auth pages through without session check
	if (path.startsWith('/api/') || path.startsWith('/auth/')) {
		return resolve(event);
	}

	// Protect all /dashboard/* routes — redirect to login if no session cookie
	if (path.startsWith('/dashboard')) {
		const session = event.cookies.get('tollgate_session');
		if (!session) {
			throw redirect(303, '/auth/login');
		}
	}

	return resolve(event);
};
