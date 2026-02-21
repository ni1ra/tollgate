import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import sql from './db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionUser {
	userId: string;
	email: string;
	name: string;
	role: string;
	tenantId: string;
	tenantName: string;
}

export interface ApiKeyIdentity {
	tenantId: string;
	keyId: string;
}

// ---------------------------------------------------------------------------
// Brute-force protection — in-memory sliding window
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
	timestamps: number[];
}

const attemptMap = new Map<string, AttemptRecord>();

/**
 * Returns true if the IP is currently blocked (>= MAX_ATTEMPTS in the window).
 */
export function bruteForceCheck(ip: string): boolean {
	const now = Date.now();
	const record = attemptMap.get(ip);
	if (!record) return false;

	// Prune stale entries
	record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_MS);
	if (record.timestamps.length === 0) {
		attemptMap.delete(ip);
		return false;
	}

	return record.timestamps.length >= MAX_ATTEMPTS;
}

/**
 * Record a failed login attempt for the given IP.
 */
export function recordFailedAttempt(ip: string): void {
	const now = Date.now();
	let record = attemptMap.get(ip);
	if (!record) {
		record = { timestamps: [] };
		attemptMap.set(ip, record);
	}
	record.timestamps.push(now);

	// Prune while we're here
	record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_MS);
}

// ---------------------------------------------------------------------------
// Password hashing — bcrypt 12 rounds
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Session validation
// ---------------------------------------------------------------------------

/**
 * Read the `tollgate_session` cookie, look up the session and joined user,
 * and return the authenticated user or null.
 */
export async function validateSession(cookies: {
	get: (name: string) => string | undefined;
}): Promise<SessionUser | null> {
	const sessionId = cookies.get('tollgate_session');
	if (!sessionId) return null;

	try {
		const rows = await sql`
			SELECT
				u.id        AS user_id,
				u.email     AS email,
				u.name      AS name,
				u.role      AS role,
				t.id        AS tenant_id,
				t.name      AS tenant_name
			FROM tollgate_sessions s
			JOIN tollgate_users u   ON u.id = s.user_id
			JOIN tollgate_tenants t ON t.id = u.tenant_id
			WHERE s.id = ${sessionId}
			  AND s.expires_at > NOW()
		`;

		if (rows.length === 0) return null;

		const row = rows[0];
		return {
			userId: row.user_id,
			email: row.email,
			name: row.name,
			role: row.role,
			tenantId: row.tenant_id,
			tenantName: row.tenant_name
		};
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// API key authentication
// ---------------------------------------------------------------------------

/**
 * Read the `X-Tollgate-Key` header, SHA-256 hash it, and look up the
 * corresponding active API key. Returns identity or null.
 */
export async function authenticateApiKey(
	request: Request
): Promise<ApiKeyIdentity | null> {
	const rawKey = request.headers.get('X-Tollgate-Key');
	if (!rawKey) return null;

	const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

	try {
		const rows = await sql`
			SELECT id AS key_id, tenant_id
			FROM tollgate_api_keys
			WHERE key_hash = ${keyHash}
			  AND revoked_at IS NULL
		`;

		if (rows.length === 0) return null;

		return {
			tenantId: rows[0].tenant_id,
			keyId: rows[0].key_id
		};
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Utilities re-exported for convenience
// ---------------------------------------------------------------------------

export { uuidv4 as generateId };
