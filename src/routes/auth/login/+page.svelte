<script lang="ts">
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin() {
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Authentication failed';
				return;
			}

			window.location.href = '/dashboard';
		} catch (e) {
			error = 'Connection failed. Try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<div class="auth-logo">TOLLGATE</div>
		<h2 style="text-align: center; margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--color-text-dim);">
			Access Terminal
		</h2>

		{#if error}
			<div class="alert alert-error">{error}</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
			<div class="form-group">
				<label class="form-label" for="email">Email</label>
				<input
					id="email"
					type="email"
					class="form-input"
					placeholder="operator@example.eu"
					bind:value={email}
					required
					autocomplete="email"
				/>
			</div>

			<div class="form-group">
				<label class="form-label" for="password">Password</label>
				<input
					id="password"
					type="password"
					class="form-input"
					placeholder="Enter passphrase"
					bind:value={password}
					required
					autocomplete="current-password"
				/>
			</div>

			<button type="submit" class="btn btn-primary w-full" disabled={loading}>
				{loading ? 'Authenticating...' : 'Authenticate'}
			</button>
		</form>

		<div class="auth-footer">
			No account? <a href="/auth/register">Initialize Terminal</a>
		</div>
	</div>
</div>
