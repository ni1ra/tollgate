<script lang="ts">
	let { data } = $props<{
		data: {
			plans: Array<{
				id: string;
				name: string;
				type: 'flat' | 'tiered' | 'usage';
				currency: string;
				amount: number | null;
				interval: string;
				usage_unit: string | null;
				created_at: string;
			}>;
		};
	}>();

	let showForm = $state(false);
	let formName = $state('');
	let formType = $state<'flat' | 'tiered' | 'usage'>('flat');
	let formAmount = $state('');
	let formInterval = $state<'month' | 'year'>('month');
	let formUsageUnit = $state('');
	let tiers = $state<Array<{ up_to: string; unit_amount: string }>>([
		{ up_to: '', unit_amount: '' }
	]);
	let error = $state('');
	let loading = $state(false);

	function addTier() {
		tiers = [...tiers, { up_to: '', unit_amount: '' }];
	}

	function removeTier(index: number) {
		tiers = tiers.filter((_, i) => i !== index);
	}

	async function createPlan() {
		error = '';
		loading = true;

		try {
			const body: Record<string, unknown> = {
				name: formName,
				type: formType,
				interval: formInterval
			};

			if (formType === 'flat') {
				body.amount = parseFloat(formAmount);
			} else if (formType === 'tiered') {
				body.tiers = tiers.map(t => ({
					up_to: parseInt(t.up_to),
					unit_amount: parseFloat(t.unit_amount)
				}));
			} else if (formType === 'usage') {
				body.usage_unit = formUsageUnit;
				if (formAmount) body.amount = parseFloat(formAmount);
			}

			const res = await fetch('/api/v1/plans', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const json = await res.json();

			if (!res.ok) {
				error = json.error || 'Failed to create plan';
				return;
			}

			window.location.reload();
		} catch {
			error = 'Connection failed';
		} finally {
			loading = false;
		}
	}

	function formatAmount(amount: number | null, currency: string): string {
		if (amount === null || amount === undefined) return '--';
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: currency || 'EUR'
		}).format(amount / 100);
	}
</script>

<div class="header">
	<h1 class="header-title">Plans</h1>
	<button class="btn btn-primary" onclick={() => { showForm = !showForm; }}>
		{showForm ? 'Cancel' : '+ New Plan'}
	</button>
</div>

{#if showForm}
	<div class="card" style="margin-bottom: 1.5rem;">
		<div class="card-header">
			<div class="card-title">Create Plan</div>
		</div>
		<div class="card-body">
			{#if error}
				<div class="alert alert-error">{error}</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); createPlan(); }}>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="p-name">Plan Name</label>
						<input id="p-name" type="text" class="form-input" bind:value={formName} required placeholder="Growth Plan" />
					</div>
					<div class="form-group">
						<label class="form-label" for="p-type">Type</label>
						<select id="p-type" class="form-input form-select" bind:value={formType}>
							<option value="flat">Flat</option>
							<option value="tiered">Tiered</option>
							<option value="usage">Usage</option>
						</select>
					</div>
				</div>

				<div class="form-row">
					{#if formType !== 'tiered'}
						<div class="form-group">
							<label class="form-label" for="p-amount">Amount (cents)</label>
							<input id="p-amount" type="number" class="form-input" bind:value={formAmount} placeholder="3900" required={formType === 'flat'} />
						</div>
					{/if}
					<div class="form-group">
						<label class="form-label" for="p-interval">Interval</label>
						<select id="p-interval" class="form-input form-select" bind:value={formInterval}>
							<option value="month">Monthly</option>
							<option value="year">Yearly</option>
						</select>
					</div>
				</div>

				{#if formType === 'usage'}
					<div class="form-group">
						<label class="form-label" for="p-usage">Usage Unit</label>
						<input id="p-usage" type="text" class="form-input" bind:value={formUsageUnit} required placeholder="api_call" />
					</div>
				{/if}

				{#if formType === 'tiered'}
					<div class="form-group">
						<label class="form-label">Tier Breakpoints</label>
						{#each tiers as tier, i}
							<div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
								<input
									type="number"
									class="form-input"
									bind:value={tier.up_to}
									placeholder="Up to (units)"
									style="flex: 1;"
								/>
								<input
									type="number"
									class="form-input"
									bind:value={tier.unit_amount}
									placeholder="Unit price (cents)"
									style="flex: 1;"
								/>
								{#if tiers.length > 1}
									<button type="button" class="btn btn-sm btn-danger" onclick={() => removeTier(i)}>X</button>
								{/if}
							</div>
						{/each}
						<button type="button" class="btn btn-sm" onclick={addTier}>+ Add Tier</button>
					</div>
				{/if}

				<button type="submit" class="btn btn-primary" disabled={loading} style="margin-top: 0.5rem;">
					{loading ? 'Creating...' : 'Create Plan'}
				</button>
			</form>
		</div>
	</div>
{/if}

{#if data.plans.length === 0}
	<div class="empty-state">
		<p>No plans created yet. Define your first pricing plan.</p>
	</div>
{:else}
	<div class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
		{#each data.plans as plan}
			<div class="card">
				<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
					<h3 style="font-size: 0.95rem; color: var(--color-text-bright); text-shadow: none;">{plan.name}</h3>
					<span class="badge badge-{plan.type}">{plan.type}</span>
				</div>
				<div style="font-family: var(--font-mono); font-size: 1.25rem; color: var(--color-primary); margin-bottom: 0.25rem;">
					{formatAmount(plan.amount, plan.currency)}
				</div>
				<div style="font-size: 0.75rem; color: var(--color-text-muted);">
					per {plan.interval}
					{#if plan.usage_unit}
						&middot; per {plan.usage_unit}
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.badge-flat {
		background: rgba(255, 215, 0, 0.12);
		color: var(--color-primary);
		border: 1px solid rgba(255, 215, 0, 0.25);
	}
	.badge-tiered {
		background: rgba(168, 85, 247, 0.12);
		color: #a855f7;
		border: 1px solid rgba(168, 85, 247, 0.25);
	}
	.badge-usage {
		background: rgba(59, 130, 246, 0.12);
		color: var(--color-info);
		border: 1px solid rgba(59, 130, 246, 0.25);
	}
</style>
