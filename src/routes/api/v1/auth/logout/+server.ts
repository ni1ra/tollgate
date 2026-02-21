import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('tollgate_session');

	if (sessionId) {
		await sql`
			DELETE FROM tollgate_sessions WHERE id = ${sessionId}
		`;
	}

	cookies.set('tollgate_session', '', {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 0
	});

	return json({ ok: true });
};
