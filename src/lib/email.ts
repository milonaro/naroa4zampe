// Servizio email per l'invio di token OTP e notifiche
// Supporta Resend (consigliato) e Nodemailer come fallback
// Configurazione tramite variabili d'ambiente

import { Resend } from 'resend';

// Inizializza il client Resend (solo se la API key è configurata)
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY non configurata. Le email non verranno inviate.');
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Invia un'email con il codice OTP per l'accesso all'area personale.
 * Utilizza Resend come provider email.
 * @param to Indirizzo email del destinatario
 * @param token Codice OTP a 6 cifre
 * @param nomeComune Nome del comune per personalizzare l'email
 */
export async function sendOtpEmail(
  to: string,
  token: string,
  nomeComune: string
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient();
  const fromEmail = process.env.EMAIL_FROM || 'noreply@a4zampe.it';

  if (!resend) {
    // In assenza di configurazione SMTP, logga il token per sviluppo
    console.log(`📧 [DEV] Email OTP per ${to}: codice = ${token} (SMTP non configurato)`);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Il tuo codice di accesso — ${nomeComune}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #92751a; margin: 0; font-size: 24px;">🐾 ${nomeApp()}</h1>
          </div>
          <h2 style="color: #1A3A5C; margin-bottom: 16px;">Accesso all'area personale</h2>
          <p style="color: #333; line-height: 1.6;">
            Ciao,<br>
            hai richiesto l'accesso all'area personale di <strong>${nomeComune}</strong>.
          </p>
          <div style="background: linear-gradient(135deg, #fef9c3, #fef08a); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 2px solid #eab308;">
            <p style="margin: 0 0 8px; color: #666; font-size: 14px;">Il tuo codice di verifica è:</p>
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1A3A5C; font-family: 'Courier New', monospace;">${token}</span>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Il codice è valido per <strong>15 minuti</strong>.<br>
            Se non hai effettuato questa richiesta, ignora questa email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Questa email è stata inviata automaticamente da ${nomeApp()}. Non rispondere a questo indirizzo.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Errore invio email OTP:', error);
      return { success: false, error: error.message };
    }

    console.log(`📧 Email OTP inviata con successo a ${to}`);
    return { success: true };
  } catch (errore) {
    console.error('Errore invio email OTP:', errore);
    return { success: false, error: String(errore) };
  }
}

/**
 * Helper per ottenere il nome app dalla configurazione
 */
function nomeApp(): string {
  return process.env.NEXT_PUBLIC_APP_NAME || 'a 4 Zampe';
}
