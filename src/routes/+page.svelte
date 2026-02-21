<script lang="ts">
	let currentYear = new Date().getFullYear();
</script>

<div class="landing">
	<!-- Header -->
	<header class="landing-header">
		<div class="landing-container">
			<a href="/" class="logo-link">TOLLGATE</a>
			<nav class="landing-nav">
				<a href="#features">Features</a>
				<a href="#how-it-works">How It Works</a>
				<a href="#pricing">Pricing</a>
				<a href="/auth/login" class="btn btn-sm">Login</a>
				<a href="/auth/register" class="btn btn-primary btn-sm">Register</a>
			</nav>
		</div>
	</header>

	<!-- Hero -->
	<section class="hero">
		<div class="landing-container">
			<div class="hero-content">
				<h1 class="hero-title glow">TOLLGATE</h1>
				<p class="hero-subtitle">EU-Sovereign Subscription Billing</p>
				<p class="hero-desc">
					Full-stack billing infrastructure that never leaves European soil.
					GDPR-native. Schrems II compliant. Your data, your jurisdiction.
				</p>
				<div class="hero-actions">
					<a href="/auth/register" class="btn btn-primary btn-lg">Start Building</a>
					<a href="#features" class="btn btn-lg">Explore Features</a>
				</div>
			</div>
			<div class="hero-code">
				<div class="code-header">
					<span class="code-dot" style="background: #ff5f57"></span>
					<span class="code-dot" style="background: #febc2e"></span>
					<span class="code-dot" style="background: #28c840"></span>
					<span class="code-filename">billing.ts</span>
				</div>
				<pre><code><span class="kw">import</span> {'{'} Tollgate {'}'} <span class="kw">from</span> <span class="str">'@tollgate/sdk'</span>;

<span class="kw">const</span> tg = <span class="kw">new</span> Tollgate({'{'} apiKey: process.env.TOLLGATE_KEY {'}'});

<span class="cm">// Create a subscription plan</span>
<span class="kw">const</span> plan = <span class="kw">await</span> tg.plans.create({'{'}
  name: <span class="str">'Growth'</span>,
  amount: <span class="num">3900</span>,
  currency: <span class="str">'EUR'</span>,
  interval: <span class="str">'month'</span>
{'}'});

<span class="cm">// Subscribe a customer</span>
<span class="kw">const</span> sub = <span class="kw">await</span> tg.subscriptions.create({'{'}
  customer_id: <span class="str">'cus_...'</span>,
  plan_id: plan.id
{'}'});

<span class="cm">// Invoice is auto-generated</span>
console.log(sub.status); <span class="cm">// 'active'</span></code></pre>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section id="features" class="section-landing">
		<div class="landing-container">
			<h2 class="section-heading">Infrastructure Components</h2>
			<div class="features-grid">
				<div class="feature-card card">
					<div class="feature-icon">&#9881;</div>
					<h3>Subscription Engine</h3>
					<p>Flat, tiered, and usage-based plans. Lifecycle management with pause, resume, and cancel. Proration built in.</p>
				</div>
				<div class="feature-card card">
					<div class="feature-icon">&#9997;</div>
					<h3>Invoice Forge</h3>
					<p>Auto-generated invoices with EU-compliant line items. VAT calculation, PDF export, and payment tracking.</p>
				</div>
				<div class="feature-card card">
					<div class="feature-icon">&#9889;</div>
					<h3>Usage Metering</h3>
					<p>Real-time usage tracking with aggregation windows. Report usage events via API, billed at period end.</p>
				</div>
				<div class="feature-card card">
					<div class="feature-icon">&#127758;</div>
					<h3>VAT Matrix</h3>
					<p>27 EU member states + UK. Auto-detect rates by country, validate VAT IDs, handle reverse charge B2B.</p>
				</div>
				<div class="feature-card card">
					<div class="feature-icon">&#128268;</div>
					<h3>Webhook Relay</h3>
					<p>Event-driven architecture. Subscribe to billing events with HMAC-signed payloads and automatic retries.</p>
				</div>
				<div class="feature-card card">
					<div class="feature-icon">&#128737;</div>
					<h3>Compliance Core</h3>
					<p>GDPR data export and erasure. Schrems II data residency. Full audit trail. Zero US cloud dependencies.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- How It Works -->
	<section id="how-it-works" class="section-landing">
		<div class="landing-container">
			<h2 class="section-heading">How It Works</h2>
			<div class="steps-grid">
				<div class="step-card">
					<div class="step-number">01</div>
					<h3>Initialize</h3>
					<p>Register your organisation and get your API key. Configure your billing preferences and VAT settings.</p>
				</div>
				<div class="step-connector"></div>
				<div class="step-card">
					<div class="step-number">02</div>
					<h3>Create Plans</h3>
					<p>Define pricing plans: flat-rate, tiered, or usage-based. Set intervals, currencies, and tier breakpoints.</p>
				</div>
				<div class="step-connector"></div>
				<div class="step-card">
					<div class="step-number">03</div>
					<h3>Subscribe</h3>
					<p>Attach customers to plans. Tollgate manages the lifecycle: activation, renewals, upgrades, and cancellations.</p>
				</div>
				<div class="step-connector"></div>
				<div class="step-card">
					<div class="step-number">04</div>
					<h3>Invoice</h3>
					<p>Invoices generate automatically at period boundaries. VAT applied per jurisdiction. Webhooks fire on every state change.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Pricing -->
	<section id="pricing" class="section-landing">
		<div class="landing-container">
			<h2 class="section-heading">Pricing</h2>
			<p class="section-subheading">No hidden fees. No US data transfer. Just billing.</p>
			<div class="pricing-grid">
				<div class="pricing-card card">
					<div class="pricing-tier">Free</div>
					<div class="pricing-price">&euro;0<span class="pricing-interval">/mo</span></div>
					<ul class="pricing-features">
						<li>Up to 100 customers</li>
						<li>Flat-rate plans only</li>
						<li>Auto-invoicing</li>
						<li>VAT calculation</li>
						<li>GDPR export/delete</li>
						<li>Community support</li>
					</ul>
					<a href="/auth/register" class="btn w-full">Get Started</a>
				</div>
				<div class="pricing-card card pricing-highlight">
					<div class="pricing-badge">Most Popular</div>
					<div class="pricing-tier">Growth</div>
					<div class="pricing-price">&euro;39<span class="pricing-interval">/mo</span></div>
					<ul class="pricing-features">
						<li>Up to 1,000 customers</li>
						<li>All plan types</li>
						<li>Usage metering</li>
						<li>Webhook relay</li>
						<li>Full compliance suite</li>
						<li>Priority support</li>
					</ul>
					<a href="/auth/register" class="btn btn-primary w-full">Start Free Trial</a>
				</div>
				<div class="pricing-card card">
					<div class="pricing-tier">Enterprise</div>
					<div class="pricing-price">&euro;99<span class="pricing-interval">/mo</span></div>
					<ul class="pricing-features">
						<li>Unlimited customers</li>
						<li>All plan types</li>
						<li>Advanced analytics</li>
						<li>Custom webhook events</li>
						<li>Dedicated EU hosting</li>
						<li>SLA &amp; onboarding</li>
					</ul>
					<a href="/auth/register" class="btn w-full">Contact Us</a>
				</div>
			</div>
		</div>
	</section>

	<!-- EU Compliance Footer -->
	<footer class="landing-footer">
		<div class="landing-container">
			<div class="footer-compliance">
				<span class="compliance-badge">GDPR</span>
				<span class="compliance-badge">Schrems II</span>
				<span class="compliance-badge">VAT/ViDA</span>
				<span class="compliance-badge">SEPA</span>
				<span class="compliance-badge">PSD2</span>
			</div>
			<p class="footer-text">
				TOLLGATE operates exclusively on EU infrastructure. All data processing occurs within the European Economic Area
				in full compliance with GDPR, Schrems II data residency requirements, and EU VAT regulations including ViDA readiness.
				SEPA payment integration and PSD2 strong customer authentication supported.
			</p>
			<div class="footer-bottom">
				<span>&copy; {currentYear} TOLLGATE. EU-Sovereign Billing Infrastructure.</span>
			</div>
		</div>
	</footer>
</div>

<style>
	/* Landing-specific styles */
	.landing {
		background: var(--color-bg);
		min-height: 100vh;
	}

	/* Header */
	.landing-header {
		border-bottom: 1px solid var(--color-border);
		padding: 0.75rem 0;
		position: sticky;
		top: 0;
		background: rgba(10, 10, 10, 0.95);
		backdrop-filter: blur(8px);
		z-index: 100;
	}
	.landing-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}
	.landing-header .landing-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.logo-link {
		font-family: var(--font-mono);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-primary);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
		text-decoration: none;
	}
	.logo-link:hover { text-decoration: none; color: var(--color-primary); }
	.landing-nav {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		font-size: 0.8rem;
	}
	.landing-nav a { color: var(--color-text-dim); }
	.landing-nav a:hover { color: var(--color-text); text-decoration: none; }

	/* Hero */
	.hero {
		padding: 5rem 0 4rem;
	}
	.hero .landing-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: center;
	}
	.hero-title {
		font-size: 3.5rem;
		letter-spacing: 0.12em;
		margin-bottom: 0.5rem;
		text-shadow: 0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.15);
	}
	.hero-subtitle {
		font-family: var(--font-mono);
		font-size: 1.1rem;
		color: var(--color-primary-dim);
		margin-bottom: 1rem;
		letter-spacing: 0.02em;
	}
	.hero-desc {
		color: var(--color-text-dim);
		font-size: 0.9rem;
		line-height: 1.7;
		margin-bottom: 2rem;
		max-width: 480px;
	}
	.hero-actions {
		display: flex;
		gap: 0.75rem;
	}

	/* Code block */
	.hero-code {
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		overflow: hidden;
	}
	.code-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		background: var(--color-bg-raised);
		border-bottom: 1px solid var(--color-border);
	}
	.code-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}
	.code-filename {
		margin-left: 0.5rem;
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}
	.hero-code pre {
		margin: 0;
		border: none;
		border-radius: 0;
		font-size: 0.78rem;
		line-height: 1.6;
		background: transparent;
	}
	.hero-code code {
		background: none;
		padding: 0;
		font-size: inherit;
		color: var(--color-text);
	}
	:global(.kw) { color: var(--color-primary); }
	:global(.str) { color: #22c55e; }
	:global(.num) { color: #f97316; }
	:global(.cm) { color: var(--color-text-muted); font-style: italic; }

	/* Features */
	.section-landing {
		padding: 4rem 0;
		border-top: 1px solid var(--color-border);
	}
	.section-heading {
		text-align: center;
		margin-bottom: 0.5rem;
		font-size: 1.5rem;
	}
	.section-subheading {
		text-align: center;
		color: var(--color-text-dim);
		font-size: 0.85rem;
		margin-bottom: 2.5rem;
	}
	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-top: 2rem;
	}
	.feature-card {
		text-align: center;
		padding: 1.5rem;
	}
	.feature-icon {
		font-size: 1.8rem;
		margin-bottom: 0.75rem;
	}
	.feature-card h3 {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--color-primary);
		margin-bottom: 0.5rem;
		text-shadow: none;
	}
	.feature-card p {
		font-size: 0.8rem;
		color: var(--color-text-dim);
		line-height: 1.6;
	}

	/* Steps */
	.steps-grid {
		display: flex;
		align-items: flex-start;
		gap: 0;
		margin-top: 2rem;
		justify-content: center;
	}
	.step-card {
		flex: 0 0 200px;
		text-align: center;
		padding: 1.25rem;
	}
	.step-number {
		font-family: var(--font-mono);
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-primary);
		text-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
		margin-bottom: 0.5rem;
	}
	.step-card h3 {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--color-text-bright);
		margin-bottom: 0.5rem;
		text-shadow: none;
	}
	.step-card p {
		font-size: 0.78rem;
		color: var(--color-text-dim);
		line-height: 1.6;
	}
	.step-connector {
		flex: 0 0 40px;
		height: 2px;
		background: var(--color-border);
		margin-top: 2.5rem;
		position: relative;
	}
	.step-connector::after {
		content: '\25B6';
		position: absolute;
		right: -6px;
		top: -8px;
		font-size: 0.7rem;
		color: var(--color-primary-dim);
	}

	/* Pricing */
	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
		margin-top: 2rem;
		align-items: start;
	}
	.pricing-card {
		padding: 2rem 1.5rem;
		text-align: center;
		position: relative;
	}
	.pricing-highlight {
		border-color: var(--color-primary) !important;
		box-shadow: 0 0 20px rgba(255, 215, 0, 0.1);
	}
	.pricing-badge {
		position: absolute;
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-primary);
		color: var(--color-bg);
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.2rem 0.75rem;
		border-radius: 2px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.pricing-tier {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-dim);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 0.75rem;
	}
	.pricing-price {
		font-family: var(--font-mono);
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 1.5rem;
		text-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
	}
	.pricing-interval {
		font-size: 0.85rem;
		font-weight: 400;
		color: var(--color-text-muted);
	}
	.pricing-features {
		list-style: none;
		text-align: left;
		margin-bottom: 1.5rem;
	}
	.pricing-features li {
		font-size: 0.8rem;
		color: var(--color-text-dim);
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--color-border-dim);
	}
	.pricing-features li::before {
		content: '\2713 ';
		color: var(--color-primary-dim);
		margin-right: 0.5rem;
	}

	/* Footer */
	.landing-footer {
		border-top: 1px solid var(--color-border);
		padding: 3rem 0 2rem;
		margin-top: 2rem;
	}
	.footer-compliance {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}
	.compliance-badge {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-primary);
		border: 1px solid rgba(255, 215, 0, 0.3);
		background: rgba(255, 215, 0, 0.05);
		padding: 0.3rem 0.75rem;
		border-radius: 2px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.footer-text {
		text-align: center;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		max-width: 700px;
		margin: 0 auto 1.5rem;
		line-height: 1.7;
	}
	.footer-bottom {
		text-align: center;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		padding-top: 1rem;
		border-top: 1px solid var(--color-border-dim);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero .landing-container {
			grid-template-columns: 1fr;
		}
		.hero-title { font-size: 2.5rem; }
		.features-grid { grid-template-columns: 1fr; }
		.steps-grid { flex-direction: column; align-items: center; }
		.step-connector { width: 2px; height: 30px; margin: 0; flex-basis: 30px; }
		.step-connector::after { right: -8px; top: auto; bottom: -6px; transform: rotate(90deg); }
		.pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin-left: auto; margin-right: auto; }
		.landing-nav { gap: 0.75rem; font-size: 0.75rem; }
	}
</style>
