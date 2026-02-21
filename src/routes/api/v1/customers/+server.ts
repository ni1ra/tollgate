import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import sql from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 250);
	const offset = parseInt(url.searchParams.get('offset') || '0');

	const customers = await sql`
		SELECT
			c.id,
			c.name,
			c.email,
			c.country,
			c.vat_id,
			c.metadata,
			c.created_at,
			c.updated_at,
			COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') AS subscription_count,
			COALESCE(SUM(i.total) FILTER (WHERE i.status != 'void'), 0) AS total_invoiced
		FROM tollgate_customers c
		LEFT JOIN tollgate_subscriptions s ON s.customer_id = c.id
		LEFT JOIN tollgate_invoices i ON i.customer_id = c.id
		WHERE c.tenant_id = ${user.tenantId}
		  AND c.deleted_at IS NULL
		GROUP BY c.id
		ORDER BY c.created_at DESC
		LIMIT ${limit}
		OFFSET ${offset}
	`;

	return json({ data: customers });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const user = await validateSession(cookies);
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	let body: {
		name?: string;
		email?: string;
		country?: string;
		vat_id?: string;
		metadata?: Record<string, unknown>;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { name, email, country, vat_id, metadata } = body;

	if (!name || !email || !country) {
		return json({ error: 'name, email, and country are required' }, { status: 400 });
	}

	// Validate 2-letter ISO country code
	if (!/^[A-Z]{2}$/.test(country)) {
		return json({ error: 'country must be a 2-letter ISO code (e.g. DE, FR, NL)' }, { status: 400 });
	}

	const id = crypto.randomUUID();

	const [customer] = await sql`
		INSERT INTO tollgate_customers (id, tenant_id, name, email, country, vat_id, metadata, created_at, updated_at)
		VALUES (
			${id},
			${user.tenantId},
			${name},
			${email},
			${country},
			${vat_id || null},
			${metadata ? JSON.stringify(metadata) : null},
			NOW(),
			NOW()
		)
		RETURNING *
	`;

	return json({ data: customer }, { status: 201 });
};
