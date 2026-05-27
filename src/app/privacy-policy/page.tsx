import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Privacy Policy — Naro a4Zampe',
  description: 'Informativa privacy conforme all\'art. 13 del GDPR (Regolamento UE 2016/679)'
};

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Titolare del Trattamento",
      content: `Comune di Naro, Piazza Giuseppe Garibaldi 1, 92028 Naro (AG)
Email: protocollo@comune.naro.ag.it
PEC: protocollo.comune.naro@pec.it`
    },
    {
      title: "Responsabile del Trattamento (DPA)",
      content: `Il servizio è fornito da a4Zampe, piattaforma per la gestione delle segnalazioni di animali randagi.
Per informazioni sul responsabile del trattamento dati: privacy@a4zampe.it
Contratto di trattamento dati (art. 28 GDPR) disponibile su richiesta.`
    },
    {
      title: "Dati trattati e finalità",
      content: `La piattaforma tratta i seguenti dati personali:

• Email del cittadino: per invio token OTP e notifiche sullo stato della segnalazione
• Posizione geografica: per geolocalizzare la segnalazione sul territorio comunale
• Fotografie: per documentare l'avvistamento dell'animale
• Descrizione testuale: per qualificare la segnalazione (taglia, colore, condizioni dell'animale)
• Codice fiscale (facoltativo): per identificazione univoca nelle comunicazioni ufficiali

Base giuridica del trattamento: art. 6(1)(e) GDPR — esecuzione di compito di interesse pubblico 
connesso alla gestione del randagismo, attività istituzionale del Comune.`
    },
    {
      title: "Modalità del trattamento",
      content: `Il trattamento dei dati avviene mediante strumenti informatici e telematici, con misure di sicurezza 
adeguate ai rischi. I dati sono accessibili solo al personale autorizzato del Comune e agli operatori 
del servizio di gestione animali.`
    },
    {
      title: "Conservazione dei dati",
      content: `I dati delle segnalazioni sono conservati per 5 anni dalla chiusura del caso, in conformità 
alle norme sull'archivio documentale degli enti pubblici (D.Lgs. 42/2004 - Codice dei beni culturali).
Trascorso tale periodo, i dati saranno anonimizzati o cancellati.`
    },
    {
      title: "Sede dei dati e trasferimento",
      content: `I dati sono conservati su infrastruttura cloud Vercel con data center localizzati nell'Unione Europea 
(Parigi, Francia), certificata ISO 27001. I dati non vengono mai trasferiti al di fuori dello 
Spazio Economico Europeo (SEE).`
    },
    {
      title: "Destinatari dei dati",
      content: `I dati possono essere comunicati a:
• Polizia Municipale del Comune di Naro
• Servizio veterinario ASL competente
• Associazioni protezionistiche convenzionate per la gestione del randagismo
• Forze dell'ordine, in caso di necessità investigative

I dati non sono diffusi pubblicamente, se non nella forma anonima aggregata per statistiche.`
    },
    {
      title: "Diritti dell'interessato",
      content: `Ai sensi degli artt. 15-22 GDPR, l'interessato ha diritto a:
• Accesso ai propri dati personali (art. 15)
• Rettifica di dati inesatti (art. 16)
• Cancellazione dei dati («diritto all'oblio») nei limiti di legge (art. 17)
• Limitazione del trattamento (art. 18)
• Portabilità dei dati (art. 20)
• Opposizione al trattamento per motivi legittimi (art. 21)

Le richieste vanno inviate a: protocollo@comune.naro.ag.it`
    },
    {
      title: "Cookie e tecnologie di tracciamento",
      content: `La piattaforma utilizza cookie tecnici necessari per il funzionamento del servizio 
(es. sessione utente, preferenze). Per maggiori informazioni, consultare la 
Cookie Policy disponibile al link /cookie-policy.`
    },
    {
      title: "Autorità di controllo",
      content: `È possibile presentare reclamo al Garante per la Protezione dei Dati Personali:
Piazza Venezia n. 11, 00187 Roma (RM)
Email: garante@gpdp.it
PEC: protocollo@gpdp.it
Sito web: www.garanteprivacy.it`
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="prose prose-yellow max-w-none">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Privacy Policy
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Informativa ai sensi dell&apos;art. 13 del Regolamento UE 2016/679 (GDPR)
        </p>

        <div className="bg-card border rounded-lg p-4 mb-8">
          <p className="text-sm text-muted-foreground">
            <strong>Ultimo aggiornamento:</strong>{' '}
            {new Date().toLocaleDateString('it-IT', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {sections.map((section, index) => (
          <section key={index} className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {section.title}
            </h2>
            <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {section.content}
            </div>
          </section>
        ))}

        <section className="mt-12 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            La presente informativa è redatta in conformità al GDPR e alle Linee Guida AgID 
            per i servizi digitali della Pubblica Amministrazione.
          </p>
        </section>
      </article>
    </div>
  );
}
