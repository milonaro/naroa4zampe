/**
 * Utility per l'invio di notifiche email istituzionali.
 * Integra la logica per avvisare i responsabili in caso di emergenze.
 */

export async function inviaEmailEmergenza(comune: any, segnalazione: any) {
  if (!comune.emailComune) {
    console.warn(`[MailService] Nessun indirizzo email configurato per il comune ${comune.nomeComune}`);
    return;
  }

  console.log(`[MAIL ALERT] 🚨 EMERGENZA CRITICA per il comune: ${comune.nomeComune}`);

  // Esempio di corpo email strutturato per l'operatore
  const subject = `🚨 URGENZA CRITICA: Segnalazione su ${comune.nomeApp}`;
  const body = `
    ATTENZIONE: È stata ricevuta una segnalazione con urgenza CRITICA.
    
    DETTAGLI:
    - Titolo: ${segnalazione.titolo}
    - Animale: ${segnalazione.tipoAnimale} (${segnalazione.razza || 'N/D'})
    - Posizione: ${segnalazione.indirizzo || 'Coordinate GPS'}
    - Segnalatore: ${segnalazione.nomeSegnalatore} ${segnalazione.cognomeSegnalatore}
    - Telefono: ${segnalazione.telefonoSegnalatore || 'N/D'}
    
    DESCRIZIONE:
    "${segnalazione.descrizione}"
    
    Accedi alla dashboard per gestire l'intervento: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
  `;
  
  console.log("Oggetto:", subject);
  console.log("Contenuto:", body);

  // TODO: Integrare Resend o Nodemailer qui per l'invio reale
}