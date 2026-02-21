<script lang="ts">
	let { data } = $props<{
		data: {
			webhooks: Array<{
				id: string;
				url: string;
				events: string[];
				created_at: string;
			}>;
			events: string[];
		};
	}>();

	let showForm = $state(false);
	let formUrl = $state('');
	let selectedEvents = $state<Set<string>>(new Set());
	let error = $state('');
	let loading = $state(false);

	function toggleEvent(event: string) {
		const next = new Set(selectedEvents);
		if (next.has(event)) {
			next.delete(event);
		} else {
			next.add(event);
		}
		selectedEvents = next;
	}

	async function registerWebhook() {
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/webhooks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: formUrl,
					events: Array.from(selectedEvents)
				})
			});

			const json = await res.json();
			if (!res.ok) {
				error = json.error || 'Failed to register webhook';
				return;
			}

			window.location.reload();
		} catch {
			error = 'Connection failed';
		} finally {
			loading = false;
		}
	}

	async function deleteWebhook(id: string) {
		const res = await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
		if (res.ok) {
			window.location.reload();
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
</script>

<div class="header">
	<h1 class="header-title">Webhooks</h1>
	<button class="btn btn-primary" onclick={() => { showForm = !showForm; }}>
		{showForm ? 'Cancel' : '+ Register Webhook'}
	</button>
</div>

{#if showForm}
	<div class="card" style="margin-bottom: 1.5rem;">
		<div class="card-header">
			<div class="card-title">Register Webhook</div>
		</div>
		<div class="card-body">
			{#if error}
				<div class="alert alert-error">{error}</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); registerWebhook(); }}>
				<div class="form-group">
					<label class="form-label" for="w-url">Endpoint URL</label>
					<input
						id="w-url"
						type="url"
						class="form-input"
						bind:value={formUrl}
						required
						placeholder="https://api.example.eu/webhooks/tollgate"
					/>
				</div>

				<div class="form-group">
					<label class="form-label">Events</label>
					<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;">
						{#each data.events as event}
							<label class="form-checkbox" style="background: var(--color-bg-input); padding: 0.3rem 0.6rem; border-radius: 2px; border: 1px solid {selectedEvents.has(event) ? 'var(--color-primary-dim)' : 'var(--color-border)'};">
								<input
									type="checkbox"
									checked={selectedEvents.has(event)}
									onchange={() => toggleEvent(event)}
								/>
								<span style="font-size: 0.75rem;">{event}</span>
							</label>
						{/each}
					</div>
				</div>

				<button type="submit" class="btn btn-primary" disabled={loading || selectedEvents.size === 0}>
					{loading ? 'Registering...' : 'Register Webhook'}
				</button>
			</form>
		</div>
	</div>
{/if}

{#if data.webhooks.length === 0}
	<div class="empty-state">
		<p>No webhooks registered. Add an endpoint to receive billing events.</p>
	</div>
{:else}
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>URL</th>
					<th>Events</th>
					<th>Created</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.webhooks as wh}
					<tr>
						<td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-bright); max-width: 300px;" class="truncate">
							{wh.url}
						</td>
						<td>
							<div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
								{#each (wh.events || []) as event}
									<span class="badge badge-info" style="font-size: 0.6rem;">{event}</span>
								{/each}
							</div>
						</td>
						<td class="text-dim">{formatDate(wh.created_at)}</td>
						<td>
							<button
								class="btn btn-sm btn-danger"
								onclick={() => deleteWebhook(wh.id)}
							>Delete</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
