import { MicrosoftEntraId } from 'arctic';
import {
	AZURE_AD_CLIENT_ID,
	AZURE_AD_CLIENT_SECRET,
	AZURE_AD_TENANT_ID,
	ORIGIN
} from '$env/static/private';

export const microsoft = new MicrosoftEntraId(
	AZURE_AD_TENANT_ID,
	AZURE_AD_CLIENT_ID,
	AZURE_AD_CLIENT_SECRET,
	`${ORIGIN}/auth/callback/microsoft`
);
