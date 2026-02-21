<script lang="ts">
	let { data } = $props<{
		data: {
			authorized: boolean;
			error: string | null;
			admin: {
				stats: {
					tenants: number;
					users: number;
					customers: number;
					subscriptions: number;
					invoices: number;
				};
				tenants: Array<{
					id: string;
					name: string;
					slug: string;
					plan: string;
					created_at: string;
					user_count: number;
					customer_count: number;
					mrr: number;
				}>;
				users: Array<{
					id: string;
					email: string;
					name: string;
					role: string;
					created_at: string;
					tenant_name: string;
				}>;
			};
		};
	}>();

	function formatDate(iso: string): string {
		if (!iso) return '--';
		return new Date(iso).toLocaleDateString('en-GB', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatEur(cents: number): string {
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: 'EUR'
		}).format(cents / 100);
	}
</script>

<div class="header">
	<h1 class="header-title">Admin Panel</h1>
</div>

{#if data.error === 'forbidden' || !data.authorized}
	<div class="card" style="text-align: center; padding: 3rem;">
		<h2 style="color: var(--color-error); margin-bottom: 0.75rem;">Access Denied</h2>
		<p style="color: var(--color-text-muted);">
			This section requires superadmin privileges. Contact your system administrator.
		</p>
		<a href="/dashboard" class="btn" style="margin-top: 1rem;">Back to Dashboard</a>
	</div>
{:else}
	<!-- Cross-tenant stats -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-label">Total Tenants</div>
			<div class="stat-value">{data.admin.stats.tenants}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Total Users</div>
			<div class="stat-value">{data.admin.stats.users}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Total Customers</div>
			<div class="stat-value">{data.admin.stats.customers}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Total Subscriptions</div>
			<div class="stat-value">{data.admin.stats.subscriptions}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Total Invoices</div>
			<div class="stat-value">{data.admin.stats.invoices}</div>
		</div>
	</div>

	<!-- Tenants Table -->
	<div class="card" style="margin-bottom: 1.5rem;">
		<div class="card-header">
			<div class="card-title">Tenants</div>
		</div>
		<div class="card-body">
			{#if data.admin.tenants.length === 0}
				<div class="table-empty">No tenants found.</div>
			{:else}
				<div class="table-container" style="border: none;">
					<table>
						<thead>
							<tr>
								<th>Name</th>
								<th>Slug</th>
								<th>Plan</th>
								<th>Users</th>
								<th>Customers</th>
								<th>MRR</th>
								<th>Created</th>
							</tr>
						</thead>
						<tbody>
							{#each data.admin.tenants as t}
								<tr>
									<td style="color: var(--color-text-bright); font-weight: 500;">{t.name}</td>
									<td style="font-family: var(--font-mono); font-size: 0.75rem;">{t.slug}</td>
									<td><span class="badge badge-active">{t.plan}</span></td>
									<td>{t.user_count}</td>
									<td>{t.customer_count}</td>
									<td style="color: var(--color-primary); font-weight: 500;">
										{formatEur(Number(t.mrr))}
									</td>
									<td class="text-dim">{formatDate(t.created_at)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>

	<!-- Users Table -->
	<div class="card">
		<div class="card-header">
			<div class="card-title">Users</div>
		</div>
		<div class="card-body">
			{#if data.admin.users.length === 0}
				<div class="table-empty">No users found.</div>
			{:else}
				<div class="table-container" style="border: none;">
					<table>
						<thead>
							<tr>
								<th>Name</th>
								<th>Email</th>
								<th>Role</th>
								<th>Tenant</th>
								<th>Created</th>
							</tr>
						</thead>
						<tbody>
							{#each data.admin.users as u}
								<tr>
									<td style="color: var(--color-text-bright); font-weight: 500;">{u.name}</td>
									<td>{u.email}</td>
									<td>
										<span class="badge {u.role === 'superuser' || u.role === 'superadmin' ? 'badge-active' : 'badge-info'}">
											{u.role}
										</span>
									</td>
									<td>{u.tenant_name}</td>
									<td class="text-dim">{formatDate(u.created_at)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
{/if}
