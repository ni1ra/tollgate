<script lang="ts">
	import type { Snippet } from 'svelte';

	let { data, children } = $props<{
		data: {
			user: { id: string; email: string; name: string; role: string };
			tenant: { id: string; name: string; slug: string; plan: string };
		};
		children: Snippet;
	}>();

	let sidebarOpen = $state(true);

	const navItems = [
		{ href: '/dashboard', label: 'Overview', icon: '\u25A3' },
		{ href: '/dashboard/customers', label: 'Customers', icon: '\u2630' },
		{ href: '/dashboard/plans', label: 'Plans', icon: '\u2261' },
		{ href: '/dashboard/subscriptions', label: 'Subscriptions', icon: '\u21BB' },
		{ href: '/dashboard/invoices', label: 'Invoices', icon: '\u2709' },
		{ href: '/dashboard/usage', label: 'Usage', icon: '\u2191' },
		{ href: '/dashboard/webhooks', label: 'Webhooks', icon: '\u26A1' },
		{ href: '/dashboard/settings', label: 'Settings', icon: '\u2699' }
	];

	const isSuperuser = $derived(
		data.user.role === 'superuser' || data.user.role === 'superadmin'
	);

	async function handleLogout() {
		await fetch('/api/v1/auth/logout', { method: 'POST' });
		window.location.href = '/auth/login';
	}
</script>

<div class="layout">
	<aside class="sidebar">
		<div class="sidebar-brand">
			<a href="/dashboard" style="color: inherit; text-decoration: none;">TOLLGATE</a>
		</div>

		<nav class="sidebar-nav">
			<div class="sidebar-section">Billing</div>
			{#each navItems as item}
				<a href={item.href} class="sidebar-link">
					<span class="icon">{item.icon}</span>
					{item.label}
				</a>
			{/each}

			{#if isSuperuser}
				<div class="sidebar-section" style="margin-top: 0.75rem;">System</div>
				<a href="/dashboard/admin" class="sidebar-link">
					<span class="icon">{'\u2318'}</span>
					Admin
				</a>
			{/if}
		</nav>

		<div class="sidebar-footer">
			<div style="margin-bottom: 0.5rem;">
				<div style="color: var(--color-text); font-size: 0.8rem; font-weight: 500;">
					{data.user.name}
				</div>
				<div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 0.15rem;">
					{data.tenant.name}
				</div>
				<div style="font-size: 0.65rem; color: var(--color-text-muted); margin-top: 0.1rem;">
					{data.user.email}
				</div>
			</div>
			<button class="btn btn-sm btn-ghost" style="width: 100%;" onclick={handleLogout}>
				Disconnect
			</button>
		</div>
	</aside>

	<main class="main-content">
		{@render children()}
	</main>
</div>
