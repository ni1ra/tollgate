<script lang="ts">
	let { data } = $props<{
		data: {
			customers: Array<{
				id: string;
				name: string;
				email: string;
				country: string;
				subscription_count: number;
				created_at: string;
			}>;
		};
	}>();

	let showForm = $state(false);
	let formName = $state('');
	let formEmail = $state('');
	let formCountry = $state('');
	let formVatId = $state('');
	let error = $state('');
	let loading = $state(false);

	async function createCustomer() {
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/customers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formName,
					email: formEmail,
					country: formCountry.toUpperCase(),
					vat_id: formVatId || undefined
				})
			});

			const json = await res.json();

			if (!res.ok) {
				error = json.error || 'Failed to create customer';
				return;
			}

			// Reload page to show new customer
			window.location.reload();
		} catch {
			error = 'Connection failed';
		} finally {
			loading = false;
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="header">
	<h1 class="header-title">Customers</h1>
	<button class="btn btn-primary" onclick={() => { showForm = !showForm; }}>
		{showForm ? 'Cancel' : '+ New Customer'}
	</button>
</div>

{#if showForm}
	<div class="card" style="margin-bottom: 1.5rem;">
		<div class="card-header">
			<div class="card-title">Add Customer</div>
		</div>
		<div class="card-body">
			{#if error}
				<div class="alert alert-error">{error}</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); createCustomer(); }}>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="c-name">Name</label>
						<input id="c-name" type="text" class="form-input" bind:value={formName} required placeholder="Acme GmbH" />
					</div>
					<div class="form-group">
						<label class="form-label" for="c-email">Email</label>
						<input id="c-email" type="email" class="form-input" bind:value={formEmail} required placeholder="billing@acme.eu" />
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="c-country">Country (ISO)</label>
						<input id="c-country" type="text" class="form-input" bind:value={formCountry} required placeholder="DE" maxlength="2" style="text-transform: uppercase;" />
					</div>
					<div class="form-group">
						<label class="form-label" for="c-vat">VAT ID (optional)</label>
						<input id="c-vat" type="text" class="form-input" bind:value={formVatId} placeholder="DE123456789" />
					</div>
				</div>
				<button type="submit" class="btn btn-primary" disabled={loading}>
					{loading ? 'Creating...' : 'Create Customer'}
				</button>
			</form>
		</div>
	</div>
{/if}

{#if data.customers.length === 0}
	<div class="empty-state">
		<p>No customers yet. Create your first customer to get started.</p>
	</div>
{:else}
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>Country</th>
					<th>Subscriptions</th>
					<th>Created</th>
				</tr>
			</thead>
			<tbody>
				{#each data.customers as customer}
					<tr>
						<td style="color: var(--color-text-bright); font-weight: 500;">{customer.name}</td>
						<td>{customer.email}</td>
						<td><span class="badge badge-info">{customer.country}</span></td>
						<td>{customer.subscription_count}</td>
						<td class="text-dim">{formatDate(customer.created_at)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
