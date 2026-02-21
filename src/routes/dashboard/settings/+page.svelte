<script lang="ts">
	let { data } = $props<{
		data: {
			settings: {
				tenant: {
					name: string;
					slug: string;
					plan: string;
					created_at: string;
				};
			};
		};
	}>();

	const tenant = $derived(data.settings.tenant);

	// GDPR Export
	let exportLoading = $state(false);
	let exportResult = $state('');
	let exportError = $state('');

	// GDPR Delete
	let deleteCustomerId = $state('');
	let deleteLoading = $state(false);
	let deleteResult = $state('');
	let deleteError = $state('');

	async function handleExport() {
		exportLoading = true;
		exportResult = '';
		exportError = '';

		try {
			const res = await fetch('/api/v1/compliance/gdpr/export', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});

			const json = await res.json();

			if (!res.ok) {
				exportError = json.error || 'Export failed';
				return;
			}

			// Trigger download of JSON
			const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `tollgate-gdpr-export-${new Date().toISOString().slice(0, 10)}.json`;
			a.click();
			URL.revokeObjectURL(url);

			exportResult = 'GDPR data export downloaded successfully.';
		} catch {
			exportError = 'Connection failed';
		} finally {
			exportLoading = false;
		}
	}

	async function handleDelete() {
		if (!deleteCustomerId.trim()) {
			deleteError = 'Customer ID is required';
			return;
		}

		if (!confirm('This will permanently delete all data for this customer. This action cannot be undone. Continue?')) {
			return;
		}

		deleteLoading = true;
		deleteResult = '';
		deleteError = '';

		try {
			const res = await fetch('/api/v1/compliance/gdpr/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ customer_id: deleteCustomerId.trim() })
			});

			const json = await res.json();

			if (!res.ok) {
				deleteError = json.error || 'Delete failed';
				return;
			}

			deleteResult = `Customer ${deleteCustomerId.slice(0, 8)} and all associated data permanently deleted.`;
			deleteCustomerId = '';
		} catch {
			deleteError = 'Connection failed';
		} finally {
			deleteLoading = false;
		}
	}

	function formatDate(iso: string): string {
		if (!iso) return '--';
		return new Date(iso).toLocaleDateString('en-GB', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="header">
	<h1 class="header-title">Settings</h1>
</div>

<!-- Organisation Info -->
<div class="card" style="margin-bottom: 1.5rem;">
	<div class="card-header">
		<div class="card-title">Organisation</div>
	</div>
	<div class="card-body">
		<div class="kv-grid">
			<div class="kv-label">Name</div>
			<div class="kv-value">{tenant.name}</div>

			<div class="kv-label">Slug</div>
			<div class="kv-value" style="font-family: var(--font-mono);">{tenant.slug}</div>

			<div class="kv-label">Plan</div>
			<div class="kv-value">
				<span class="badge badge-active">{tenant.plan}</span>
			</div>

			<div class="kv-label">Created</div>
			<div class="kv-value">{formatDate(tenant.created_at)}</div>
		</div>
	</div>
</div>

<!-- GDPR Compliance -->
<div class="card" style="margin-bottom: 1.5rem;">
	<div class="card-header">
		<div class="card-title">GDPR Compliance</div>
	</div>
	<div class="card-body">
		<p style="font-size: 0.8rem; color: var(--color-text-dim); margin-bottom: 1.5rem;">
			EU data subject rights. Export all billing data or permanently delete a customer's data under GDPR Article 17 (Right to Erasure).
		</p>

		<!-- Export Section -->
		<div style="margin-bottom: 2rem;">
			<h3 style="font-size: 0.85rem; color: var(--color-text-bright); margin-bottom: 0.75rem; text-shadow: none;">
				Data Export (Art. 20 - Portability)
			</h3>

			{#if exportError}
				<div class="alert alert-error">{exportError}</div>
			{/if}
			{#if exportResult}
				<div class="alert alert-success">{exportResult}</div>
			{/if}

			<button
				class="btn btn-primary"
				onclick={handleExport}
				disabled={exportLoading}
			>
				{exportLoading ? 'Exporting...' : 'Export Tenant Data'}
			</button>
		</div>

		<!-- Delete Section -->
		<div>
			<h3 style="font-size: 0.85rem; color: var(--color-text-bright); margin-bottom: 0.75rem; text-shadow: none;">
				Data Erasure (Art. 17 - Right to be Forgotten)
			</h3>

			{#if deleteError}
				<div class="alert alert-error">{deleteError}</div>
			{/if}
			{#if deleteResult}
				<div class="alert alert-success">{deleteResult}</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleDelete(); }} style="display: flex; gap: 0.75rem; align-items: flex-end;">
				<div class="form-group" style="flex: 1; margin-bottom: 0;">
					<label class="form-label" for="del-cust">Customer ID</label>
					<input
						id="del-cust"
						type="text"
						class="form-input"
						bind:value={deleteCustomerId}
						placeholder="Customer UUID"
						required
					/>
				</div>
				<button
					type="submit"
					class="btn btn-danger"
					disabled={deleteLoading}
				>
					{deleteLoading ? 'Deleting...' : 'Delete Customer Data'}
				</button>
			</form>
			<p class="form-hint" style="color: var(--color-error); margin-top: 0.5rem; font-size: 0.7rem;">
				Warning: This permanently deletes the customer and all associated subscriptions, invoices, and usage records.
			</p>
		</div>
	</div>
</div>
