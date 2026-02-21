<script lang="ts">
	let org_name = $state('');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let apiKey = $state('');
	let registered = $state(false);
	let copied = $state(false);

	async function handleRegister() {
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ org_name, name, email, password })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Registration failed';
				return;
			}

			apiKey = data.api_key;
			registered = true;
		} catch (e) {
			error = 'Connection failed. Try again.';
		} finally {
			loading = false;
		}
	}

	async function copyKey() {
		try {
			await navigator.clipboard.writeText(apiKey);
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		} catch {
			// fallback: select the text
		}
	}
</script>

<div class="auth-container">
	<div class="auth-card" style="max-width: 440px;">
		<div class="auth-logo">TOLLGATE</div>
		<h2 style="text-align: center; margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--color-text-dim);">
			Initialize Billing Terminal
		</h2>

		{#if registered}
			<div class="alert alert-success" style="color: var(--color-success); background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.3);">
				Terminal initialized. Save your API key below — it will only be shown once.
			</div>

			<div class="form-group">
				<label class="form-label">Your API Key (show-once)</label>
				<div style="display: flex; gap: 0.5rem;">
					<input
						type="text"
						class="form-input"
						value={apiKey}
						readonly
						style="font-size: 0.7rem;"
					/>
					<button class="btn btn-sm" onclick={copyKey}>
						{copied ? 'Copied' : 'Copy'}
					</button>
				</div>
				<p class="form-hint" style="color: var(--color-warning); margin-top: 0.5rem;">
					Store this key securely. It cannot be retrieved after you leave this page.
				</p>
			</div>

			<a href="/dashboard" class="btn btn-primary w-full" style="margin-top: 1rem;">
				Enter Dashboard
			</a>
		{:else}
			{#if error}
				<div class="alert alert-error">{error}</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }}>
				<div class="form-group">
					<label class="form-label" for="org_name">Organisation Name</label>
					<input
						id="org_name"
						type="text"
						class="form-input"
						placeholder="Acme GmbH"
						bind:value={org_name}
						required
					/>
				</div>

				<div class="form-group">
					<label class="form-label" for="name">Your Name</label>
					<input
						id="name"
						type="text"
						class="form-input"
						placeholder="Max Mustermann"
						bind:value={name}
						required
					/>
				</div>

				<div class="form-group">
					<label class="form-label" for="reg_email">Email</label>
					<input
						id="reg_email"
						type="email"
						class="form-input"
						placeholder="admin@acme.eu"
						bind:value={email}
						required
						autocomplete="email"
					/>
				</div>

				<div class="form-group">
					<label class="form-label" for="reg_password">Password</label>
					<input
						id="reg_password"
						type="password"
						class="form-input"
						placeholder="Min. 8 characters"
						bind:value={password}
						required
						minlength="8"
						autocomplete="new-password"
					/>
				</div>

				<button type="submit" class="btn btn-primary w-full" disabled={loading}>
					{loading ? 'Initializing...' : 'Initialize Terminal'}
				</button>
			</form>

			<div class="auth-footer">
				Already registered? <a href="/auth/login">Access Terminal</a>
			</div>
		{/if}
	</div>
</div>
