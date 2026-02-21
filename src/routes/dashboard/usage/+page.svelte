<script lang="ts">
	let { data } = $props<{
		data: {
			usage: Array<{
				id: string;
				subscription_id: string;
				quantity: number;
				description: string | null;
				timestamp: string;
				created_at: string;
			}>;
			subscriptions: Array<{
				id: string;
				customer_name: string;
				plan_name: string;
				status: string;
			}>;
		};
	}>();

	let showForm = $state(false);
	let formSubId = $state('');
	let formQuantity = $state('');
	let formDescription = $state('');
	let error = $state('');
	let loading = $state(false);

	// For viewing usage by subscription
	const initialSubId = data.subscriptions[0]?.id ?? '';
	const initialUsage = data.usage;
	let selectedSubId = $state(initialSubId);
	let usageRecords = $state(initialUsage);
	let loadingUsage = $state(false);

	async function loadUsage() {
		if (!selectedSubId) return;
		loadingUsage = true;
		try {
			const res = await fetch(`/api/v1/usage?subscription_id=${selectedSubId}`);
			if (res.ok) {
				const json = await res.json();
				usageRecords = json.data ?? [];
			}
		} finally {
			loadingUsage = false;
		}
	}

	async function reportUsage() {
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/usage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subscription_id: formSubId,
					quantity: parseFloat(formQuantity),
					description: formDescription || undefined
				})
			});

			const json = await res.json();
			if (!res.ok) {
				error = json.error || 'Failed to report usage';
				return;
			}

			// Reload usage records
			formQuantity = '';
			formDescription = '';
			showForm = false;
			if (formSubId === selectedSubId) {
				await loadUsage();
			}
		} catch {
			error = 'Connection failed';
		} finally {
			loading = false;
		}
	}

	function formatDate(iso: string): string {
		if (!iso) return '--';
		return new Date(iso).toLocaleString('en-GB', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="header">
	<h1 class="header-title">Usage</h1>
	<button class="btn btn-primary" onclick={() => { showForm = !showForm; }}>
		{showForm ? 'Cancel' : 'Report Usage'}
	</button>
</div>

{#if showForm}
	<div class="card" style="margin-bottom: 1.5rem;">
		<div class="card-header">
			<div class="card-title">Report Usage</div>
		</div>
		<div class="card-body">
			{#if error}
				<div class="alert alert-error">{error}</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); reportUsage(); }}>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="u-sub">Subscription</label>
						<select id="u-sub" class="form-input form-select" bind:value={formSubId} required>
							<option value="">Select subscription...</option>
							{#each data.subscriptions as sub}
								<option value={sub.id}>
									{sub.customer_name} - {sub.plan_name}
								</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label class="form-label" for="u-qty">Quantity</label>
						<input id="u-qty" type="number" class="form-input" bind:value={formQuantity} required min="0" step="any" placeholder="100" />
					</div>
				</div>
				<div class="form-group">
					<label class="form-label" for="u-desc">Description (optional)</label>
					<input id="u-desc" type="text" class="form-input" bind:value={formDescription} placeholder="API calls for batch processing" />
				</div>
				<button type="submit" class="btn btn-primary" disabled={loading}>
					{loading ? 'Reporting...' : 'Report Usage'}
				</button>
			</form>
		</div>
	</div>
{/if}

<!-- Subscription selector for viewing usage -->
{#if data.subscriptions.length > 0}
	<div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
		<label class="form-label" for="view-sub" style="margin: 0; white-space: nowrap;">View usage for:</label>
		<select
			id="view-sub"
			class="form-input form-select"
			style="max-width: 400px;"
			bind:value={selectedSubId}
			onchange={loadUsage}
		>
			{#each data.subscriptions as sub}
				<option value={sub.id}>{sub.customer_name} - {sub.plan_name}</option>
			{/each}
		</select>
		{#if loadingUsage}
			<span class="spinner"></span>
		{/if}
	</div>
{/if}

{#if usageRecords.length === 0}
	<div class="empty-state">
		<p>No usage records for this subscription.</p>
	</div>
{:else}
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Subscription</th>
					<th>Quantity</th>
					<th>Description</th>
					<th>Timestamp</th>
				</tr>
			</thead>
			<tbody>
				{#each usageRecords as record}
					<tr>
						<td style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-muted);">
							{record.subscription_id.slice(0, 8)}
						</td>
						<td style="font-weight: 600; color: var(--color-primary);">{record.quantity}</td>
						<td>{record.description || '--'}</td>
						<td class="text-dim">{formatDate(record.timestamp)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
