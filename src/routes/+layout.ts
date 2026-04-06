import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
import type { LayoutLoad } from './$types';

injectAnalytics({ mode: dev ? 'development' : 'production' });
injectSpeedInsights();

export const load: LayoutLoad = async ({ data }) => {
	return {
		user: data.user,
		session: data.session,
		perfil: data.perfil
	};
};
