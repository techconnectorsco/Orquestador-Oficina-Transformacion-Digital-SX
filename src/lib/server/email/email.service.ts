import {
	AZURE_GRAPH_CLIENT_ID,
	AZURE_GRAPH_CLIENT_SECRET,
	AZURE_GRAPH_TENANT_ID,
	ORIGIN
} from '$env/static/private';

const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';
const FROM_EMAIL = 'boot@soportexperto.com';

// Cache del token para no pedir uno nuevo en cada email
let accessToken: string | null = null;
let tokenExpires: number = 0;

/**
 * Obtiene un access token de Microsoft Graph usando Client Credentials
 */
async function getAccessToken(): Promise<string> {
	// Si el token aún es válido, reutilizarlo
	if (accessToken && Date.now() < tokenExpires - 60000) {
		return accessToken;
	}

	const tokenUrl = `https://login.microsoftonline.com/${AZURE_GRAPH_TENANT_ID}/oauth2/v2.0/token`;

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: AZURE_GRAPH_CLIENT_ID,
			client_secret: AZURE_GRAPH_CLIENT_SECRET,
			scope: 'https://graph.microsoft.com/.default',
			grant_type: 'client_credentials'
		})
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('[getAccessToken] Error:', error);
		throw new Error('Failed to get access token');
	}

	const data = await response.json();
	accessToken = data.access_token;
	tokenExpires = Date.now() + data.expires_in * 1000;

	return accessToken;
}

/**
 * Envía un email usando Microsoft Graph API
 */
async function sendEmail(
	to: string,
	subject: string,
	htmlContent: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const token = await getAccessToken();

		const response = await fetch(
			`${GRAPH_API_URL}/users/${FROM_EMAIL}/sendMail`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: {
						subject,
						body: {
							contentType: 'HTML',
							content: htmlContent
						},
						toRecipients: [
							{
								emailAddress: {
									address: to
								}
							}
						]
					},
					saveToSentItems: false
				})
			}
		);

		if (!response.ok) {
			const error = await response.text();
			console.error('[sendEmail] Graph API error:', error);
			return { success: false, error: `Graph API error: ${response.status}` };
		}

		console.log('[sendEmail] Email enviado a:', to);
		return { success: true };
	} catch (error) {
		console.error('[sendEmail] Exception:', error);
		return { success: false, error: 'Error al enviar el email' };
	}
}

/**
 * Envía email de verificación de cuenta
 */
export async function sendVerificationEmail(
	email: string,
	token: string,
	firstName: string
): Promise<{ success: boolean; error?: string }> {
	const verifyUrl = `${ORIGIN}/auth/verify/${token}`;

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		</head>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
			<div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
				<h1 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0;">
					¡Hola${firstName ? ` ${firstName}` : ''}!
				</h1>
				
				<p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
					Gracias por registrarte en OTD_SX. Para completar tu registro, haz clic en el siguiente botón:
				</p>
				
				<a href="${verifyUrl}" 
				   style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
					Verificar mi cuenta
				</a>
				
				<p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
					Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
				</p>
				<p style="color: #2563eb; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
					${verifyUrl}
				</p>
				
				<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
				
				<p style="color: #a1a1aa; font-size: 12px; margin: 0;">
					Este enlace expira en 24 horas. Si no solicitaste esta verificación, puedes ignorar este correo.
				</p>
			</div>
		</body>
		</html>
	`;

	return sendEmail(email, 'Verifica tu cuenta - OTD_SX', html);
}

/**
 * Envía email de reset de contraseña
 */
export async function sendPasswordResetEmail(
	email: string,
	token: string,
	firstName: string
): Promise<{ success: boolean; error?: string }> {
	const resetUrl = `${ORIGIN}/auth/update-password?token=${token}`;

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		</head>
		<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
			<div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
				<h1 style="color: #18181b; font-size: 24px; margin: 0 0 24px 0;">
					Restablecer contraseña
				</h1>
				
				<p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
					Hola${firstName ? ` ${firstName}` : ''}, recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente botón:
				</p>
				
				<a href="${resetUrl}" 
				   style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
					Restablecer contraseña
				</a>
				
				<p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
					Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
				</p>
				<p style="color: #2563eb; font-size: 14px; word-break: break-all; margin: 8px 0 24px 0;">
					${resetUrl}
				</p>
				
				<hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
				
				<p style="color: #a1a1aa; font-size: 12px; margin: 0;">
					Este enlace expira en 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
				</p>
			</div>
		</body>
		</html>
	`;

	return sendEmail(email, 'Restablecer contraseña - OTD_SX', html);
}