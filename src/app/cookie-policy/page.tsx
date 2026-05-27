import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Cookie Policy — Naro a4Zampe',
  description: 'Informativa sull\'uso dei cookie e tecnologie di tracciamento'
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="prose prose-yellow max-w-none">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Cookie Policy
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Informativa sull&apos;uso dei cookie e delle tecnologie di tracciamento
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Cosa sono i cookie</h2>
          <p className="mb-4">
            I cookie sono piccoli file di testo che i siti visitati dall&apos;utente inviano 
            al suo terminale (di solito al browser), dove vengono memorizzati per essere 
            poi ritrasmessi agli stessi siti alla successiva visita dello stesso utente.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Tipologie di cookie utilizzati</h2>
          
          <div className="bg-card border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-foreground mb-2">Cookie Tecnici (Necessari)</h3>
            <p className="text-muted-foreground mb-2">
              Questi cookie sono essenziali per il corretto funzionamento della piattaforma e 
              non possono essere disabilitati. Vengono utilizzati per:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Gestire la sessione di autenticazione dell&apos;utente</li>
              <li>Memorizzare le preferenze di lingua e accessibilità</li>
              <li>Garantire la sicurezza delle transazioni</li>
              <li>Bilanciare il carico sui server</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Base giuridica:</strong> art. 6(1)(e) GDPR — esecuzione di compito di interesse pubblico
            </p>
          </div>

          <div className="bg-card border rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-foreground mb-2">Cookie Analitici (Anonimi)</h3>
            <p className="text-muted-foreground mb-2">
              La piattaforma potrebbe utilizzare cookie analitici anonimizzati per raccogliere 
              informazioni statistiche sull&apos;utilizzo del sito. Questi cookie non tracciano 
              l&apos;identità dell&apos;utente.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Attualmente non utilizziamo cookie analitici di terze parti.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-2">Cookie di Profilazione</h3>
            <p className="text-muted-foreground">
              <strong>Non utilizziamo cookie di profilazione.</strong> Nessun dato personale viene 
              raccolto per creare profili utente o per inviare pubblicità mirata.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Gestione delle preferenze</h2>
          <p className="mb-4">
            L&apos;utente può gestire le proprie preferenze relative ai cookie attraverso le 
            impostazioni del browser. Di seguito i link alle guide per i browser più comuni:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" className="text-primary hover:underline">
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/it/kb/Eliminare%20i%20cookie" target="_blank" rel="noopener" className="text-primary hover:underline">
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener" className="text-primary hover:underline">
                Apple Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener" className="text-primary hover:underline">
                Microsoft Edge
              </a>
            </li>
          </ul>
          <p className="text-muted-foreground">
            Si precisa che la disabilitazione dei cookie tecnici potrebbe compromettere 
            il corretto funzionamento della piattaforma.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Diritti dell&apos;interessato</h2>
          <p className="mb-4">
            Per esercitare i propri diritti in materia di protezione dei dati personali, 
            l&apos;interessato può contattare il Titolare del Trattamento:
          </p>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-muted-foreground">
              Comune di Naro<br />
              Email: <a href="mailto:protocollo@comune.naro.ag.it" className="text-primary hover:underline">protocollo@comune.naro.ag.it</a><br />
              PEC: <a href="mailto:protocollo.comune.naro@pec.it" className="text-primary hover:underline">protocollo.comune.naro@pec.it</a>
            </p>
          </div>
        </section>

        <section className="mt-12 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Ultimo aggiornamento:</strong>{' '}
            {new Date().toLocaleDateString('it-IT', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </section>
      </article>
    </div>
  );
}
