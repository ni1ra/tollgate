<script lang="ts">
	let { data } = $props<{
		data: {
			subscriptions: Array<{
				id: string;
				status: string;
				quantity: number;
				current_period_start: string;
				current_period_end: string;
				created_at: string;
				customer_name: string;
				customer_email: string;
				plan_name: string;
				plan_amount: number;
				plan_currency: string;
				plan_interval: string;
			}>;
			customers: Array<{ id: string; name: string; email: string }>;
			plans: Array<{ id: string; name: string; type: string; amount: number }>;
		};
	}>();

	let showForm = $state(false);
	let formCustomerId = $state('');
	let formPlanId = $state('');
	let formQuantity = $state('1');
	let error = $state('');
	let loading = $state(false);
	let actionLoading = $state('');

	async function createSubscription() {
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customer_id: formCustomerId,
					plan_id: formPlanId,
					quantity: parseInt(formQuantity) || 1
				})
			});

			const json = await res.json();
			if (!res.ok) {
				error = json.error || 'Failed to create subscription';
				return;
			}

			window.location.reload();
		} catch {
			error = 'Connection failed';
		} finally {
			loading = false;
		}
	}

	async function updateStatus(subId: string, newStatus: string) {
		actionLoading = subId;
		try {
			const res = await fetch(`/api/v1/subscriptions/${subId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});

			if (res.ok) {
				window.location.reload();
			}
		} finally {
			actionLoading = '';
		}
	}

	function formatDate(iso: string): string {
		if (!iso) return '--';
		return new Date(iso).toLocaleDateString('en-GB', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function badgeClass(status: string): string {
		const map: Record<string, string> = {
			active: 'badge-active',
			paused: 'badge-paused',
			cancelled: 'badge-cancelled',
			trialing: 'badge-paused'
		};
		return map[status] || 'badge-info';
	}
</script>

<div class="header">
	<h1 class="header-title">Subscriptions</h1>
	<button class="btn btn-primary" onclick={() => { showForm = !showForm; }}>
		{showForm ? 'Cancel' : '+ New Subscription'}
	</button>
</div>

{#if showForm}
	<div class="card" style="margin-bottom: 1.5rem;">
		<div class="card-header">
			<div class="card-title">Create Subscription</div>
		</div>
		<div class="card-body">
			{#if error}
				<div class="alert alert-error">{error}</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); createSubscription(); }}>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="s-customer">Customer</label>
						<select id="s-customer" class="form-input form-select" bind:value={formCustomerId} required>
							<option value="">Select customer...</option>
							{#each data.customers as c}
								<option value={c.id}>{c.name} ({c.email})</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label class="form-label" for="s-plan">Plan</label>
						<select id="s-plan" class="form-input form-select" bind:value={formPlanId} required>
							<option value="">Select plan...</option>
							{#each data.plans as p}
								<option value={p.id}>{p.name} ({p.type})</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="form-group" style="max-width: 200px;">
					<label class="form-label" for="s-qty">Quantity</label>
					<input id="s-qty" type="number" class="form-input" bind:value={formQuantity} min="1" />
				</div>
				<button type="submit" class="btn btn-primary" disabled={loading}>
					{loading ? 'Creating...' : 'Create Subscription'}
				</button>
			</form>
		</div>
	</div>
{/if}

{#if data.subscriptions.length === 0}
	<div class="empty-state">
		<p>No subscriptions yet. Attach a customer to a plan to begin.</p>
	</div>
{:else}
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Customer</th>
					<th>Plan</th>
					<th>Status</th>
					<th>Qty</th>
					<th>Period</th>
					<th>Created</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.subscriptions as sub}
					<tr>
						<td style="color: var(--color-text-bright);">{sub.customer_name}</td>
						<td>{sub.plan_name}</td>
						<td><span class="badge {badgeClass(sub.status)}">{sub.status}</span></td>
						<td>{sub.quantity}</td>
						<td class="text-xs text-dim">
							{formatDate(sub.current_period_start)} &mdash; {formatDate(sub.current_period_end)}
						</td>
						<td class="text-dim">{formatDate(sub.created_at)}</td>
						<td>
							<div class="btn-group">
								{#if sub.status === 'active'}
									<button
										class="btn btn-sm"
										disabled={actionLoading === sub.id}
										onclick={() => updateStatus(sub.id, 'paused')}
									>Pause</button>
									<button
										class="btn btn-sm btn-danger"
										disabled={actionLoading === sub.id}
										onclick={() => updateStatus(sub.id, 'cancelled')}
									>Cancel</button>
								{:else if sub.status === 'paused'}
									<button
										class="btn btn-sm"
										disabled={actionLoading === sub.id}
										onclick={() => updateStatus(sub.id, 'active')}
									>Resume</button>
									<button
										class="btn btn-sm btn-danger"
										disabled={actionLoading === sub.id}
										onclick={() => updateStatus(sub.id, 'cancelled')}
									>Cancel</button>
								{:else}
									<span class="text-xs text-dim">--</span>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
