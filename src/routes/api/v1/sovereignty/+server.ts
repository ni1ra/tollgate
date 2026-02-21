import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({
		jurisdiction: 'European Union',
		data_residency: 'eu-west-1 (Ireland)',
		infrastructure: 'Hetzner/OVH (EU-only)',
		compliance: ['GDPR', 'Schrems II', 'EU VAT/ViDA', 'SEPA', 'PSD2'],
		us_cloud_act_exposure: 'none',
		third_party_us_services: 'none',
		note: 'TOLLGATE is a fully EU-sovereign subscription billing system. No data is processed by, stored in, or accessible to US-jurisdiction services. This replaces US-based billing platforms such as Chargebee, Recurly, and Stripe Billing with infrastructure that cannot be subpoenaed under the US CLOUD Act or compelled under FISA 702.'
	});
};
