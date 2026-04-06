export const AUTH_PATHS = {
	LOGIN: '/auth?mode=login',
	REGISTER: '/auth?mode=register'
} as const;

export const AUTH_REDIRECT_PATHS = {
	SUCCESS: {
		LOGIN: '/',
		REGISTER: '/auth?mode=login',
		PASSWORD_UPDATE: '/auth?message=Contraseña actualizada correctamente',
		OAUTH: '/',
		LOGOUT: '/'
	},
	ERROR: {
		DEFAULT: '/auth/error',
		VERIFICATION: '/auth'
	},
	FLOW: {
		RESET: '/auth/reset',
		VERIFY: '/auth/verify',
		UPDATE_PASSWORD: '/auth/update-password'
	}
} as const;

export const PASSWORD_VALIDATION = {
	MIN_LENGTH: 8
} as const;

export function getRedirectURL(request: Request, path: string): string {
	const url = new URL(request.url);
	return `${url.protocol}//${url.host}${path}`;
}