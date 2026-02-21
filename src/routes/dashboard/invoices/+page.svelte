<script lang="ts">
	let { data } = $props<{
		data: {
			invoices: Array<{
				id: string;
				status: string;
				subtotal: number;
				vat_rate: number;
				vat_amount: number;
				total: number;
				currency: string;
				created_at: string;
				customer_name: string;
				customer_email: string;
				subscription_id: string;
				plan_name: string;
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
	let error = $state('');
	let loading = $state(false);

	async function generateInvoice() {
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/invoices/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subscription_id: formSubId })
			});

			const json = await res.json();
			if (!res.ok) {
				error = json.error || 'Failed to generate invoice';
				return;
			}

			window.location.reload();
		} catch {
			error = 'Connection failed';
		} finally {
			loading = false;
		}
	}

	function formatEur(cents: number, currency?: string): string {
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: currency || 'EUR'
		}).format(cents / 100);
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
			draft: 'badge-paused',
			finalized: 'badge-info',
			paid: 'badge-paid',
			void: 'badge-cancelled'
		};
		return map[status] || 'badge-info';
	}

	function shortId(id: string): string {
		return id.slice(0, 8).toUpperCase();
	}
</script>

<div class="header">
	<h1 class="header-title">Invoices</h1>
	<button class="btn btn-primary" onclick={() => { showForm = !showForm; }}>
		{showForm ? 'Cancel' : 'Generate Invoice'}
	</button>
</div>

{#if showForm}
	<div class="card" style="margin-bottom: 1.5rem;">
		<div class="card-header">
			<div class="card-title">Generate Invoice</div>
		</div>
		<div class="card-body">
			{#if error}
				<div class="alert alert-error">{error}</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); generateInvoice(); }}>
				<div class="form-group">
					<label class="form-label" for="inv-sub">Subscription</label>
					<select id="inv-sub" class="form-input form-select" bind:value={formSubId} required>
						<option value="">Select subscription...</option>
						{#each data.subscriptions as sub}
							<option value={sub.id}>
								{sub.customer_name} - {sub.plan_name} ({sub.status})
							</option>
						{/each}
					</select>
				</div>
				<button type="submit" class="btn btn-primary" disabled={loading}>
					{loading ? 'Generating...' : 'Generate Invoice'}
				</button>
			</form>
		</div>
	</div>
{/if}

{#if data.invoices.length === 0}
	<div class="empty-state">
		<p>No invoices yet. Generate one from an active subscription.</p>
	</div>
{:else}
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Invoice #</th>
					<th>Customer</th>
					<th>Subtotal</th>
					<th>VAT</th>
					<th>Total</th>
					<th>Status</th>
					<th>Date</th>
				</tr>
			</thead>
			<tbody>
				{#each data.invoices as inv}
					<tr>
						<td style="font-family: var(--font-mono); color: var(--color-primary-dim);">{shortId(inv.id)}</td>
						<td style="color: var(--color-text-bright);">{inv.customer_name}</td>
						<td>{formatEur(inv.subtotal, inv.currency)}</td>
						<td class="text-dim">{formatEur(inv.vat_amount, inv.currency)}</td>
						<td style="font-weight: 600; color: var(--color-primary);">{formatEur(inv.total, inv.currency)}</td>
						<td><span class="badge {badgeClass(inv.status)}">{inv.status}</span></td>
						<td class="text-dim">{formatDate(inv.created_at)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
