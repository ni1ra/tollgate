<script lang="ts">
	let { data } = $props<{
		data: {
			overview: {
				mrr: number;
				active_subscriptions: number;
				total_customers: number;
				total_invoiced: number;
				churn_rate: number;
				revenue_trend: { month: string; amount: number }[];
			};
		};
	}>();

	const o = $derived(data.overview);

	function formatEur(cents: number): string {
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: 'EUR'
		}).format(cents / 100);
	}

	function formatPercent(rate: number): string {
		return (rate * 100).toFixed(1) + '%';
	}

	const maxRevenue = $derived(
		Math.max(...(o.revenue_trend.map((r: { month: string; amount: number }) => r.amount)), 1)
	);
</script>

<div class="header">
	<h1 class="header-title">Overview</h1>
</div>

<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-label">Monthly Recurring Revenue</div>
		<div class="stat-value">{formatEur(o.mrr)}</div>
	</div>
	<div class="stat-card">
		<div class="stat-label">Active Subscriptions</div>
		<div class="stat-value">{o.active_subscriptions}</div>
	</div>
	<div class="stat-card">
		<div class="stat-label">Total Customers</div>
		<div class="stat-value">{o.total_customers}</div>
	</div>
	<div class="stat-card">
		<div class="stat-label">Total Invoiced</div>
		<div class="stat-value">{formatEur(o.total_invoiced)}</div>
	</div>
	<div class="stat-card">
		<div class="stat-label">Churn Rate (30d)</div>
		<div class="stat-value">{formatPercent(o.churn_rate)}</div>
	</div>
</div>

<div class="card" style="margin-top: 1.5rem;">
	<div class="card-header">
		<div class="card-title">Revenue Trend (6 months)</div>
	</div>
	<div class="card-body">
		{#if o.revenue_trend.length === 0}
			<div class="empty-state">
				<p>No revenue data yet. Invoices will populate this chart.</p>
			</div>
		{:else}
			<div class="chart-container">
				{#each o.revenue_trend as point}
					<div class="chart-bar-wrapper">
						<div class="chart-amount">{formatEur(point.amount)}</div>
						<div
							class="chart-bar"
							style="height: {Math.max((point.amount / maxRevenue) * 180, 4)}px"
						></div>
						<div class="chart-label">{point.month}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.chart-container {
		display: flex;
		align-items: flex-end;
		gap: 1.25rem;
		padding: 1rem 0.5rem;
		min-height: 240px;
	}
	.chart-bar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		gap: 0.4rem;
	}
	.chart-amount {
		font-family: var(--font-mono);
		font-size: 0.65rem;
		color: var(--color-text-dim);
		white-space: nowrap;
	}
	.chart-bar {
		width: 100%;
		max-width: 60px;
		background: linear-gradient(to top, rgba(255, 215, 0, 0.6), rgba(255, 215, 0, 0.2));
		border: 1px solid rgba(255, 215, 0, 0.4);
		border-radius: 2px 2px 0 0;
		transition: height 300ms ease;
	}
	.chart-label {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}
</style>
