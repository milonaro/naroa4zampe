import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dichiarazione di accessibilità — Naro a4Zampe',
  description: 'Dichiarazione di accessibilità conforme alla Legge 4/2004 e al D.Lgs. 106/2018'
};

export default function AccessibilitaPage() {
  const ultimoAggiornamento = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="prose prose-yellow max-w-none">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Dichiarazione di accessibilità
        </h1>

        <p className="text-lg text-muted-foreground mb-6">
          Il Comune di Naro si impegna a rendere il proprio sito web accessibile,
          conformemente alla Legge 4/2004 (Legge Stanca) e al D.Lgs. 106/2018 che ha recepito
          la Direttiva UE 2016/2102.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Stato di conformità</h2>
          <p className="mb-4">
            Questo sito è <strong className="text-primary">parzialmente conforme</strong> alle norme
            EN 301 549 V3.2.1 e alle WCAG 2.1 livello AA, a causa delle non conformità elencate di seguito.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Contenuti non accessibili</h2>
          <p className="mb-3">I seguenti contenuti presentano limitazioni di accessibilità:</p>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>
              La mappa interattiva (Leaflet) non è completamente fruibile da screen reader — 
              <strong className="text-primary"> in fase di adeguamento</strong>
            </li>
            <li>
              Alcuni elementi grafici decorativi potrebbero non avere testo alternativo appropriato
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Stiamo lavorando per migliorare costantemente l&apos;accessibilità della piattaforma.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Meccanismo di feedback</h2>
          <p className="mb-4">
            Per segnalare problemi di accessibilità o richiedere informazioni in formati alternativi:
          </p>
          <div className="bg-card border rounded-lg p-4 mb-4">
            <p className="mb-2">
              <strong>Email:</strong>{' '}
              <a 
                href="mailto:protocollo@comune.naro.ag.it" 
                className="text-primary hover:underline"
              >
                protocollo@comune.naro.ag.it
              </a>
            </p>
            <p>
              <strong>PEC:</strong>{' '}
              <a 
                href="mailto:protocollo.comune.naro@pec.it" 
                className="text-primary hover:underline"
              >
                protocollo.comune.naro@pec.it
              </a>
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Procedura di attuazione</h2>
          <p className="mb-4">
            In caso di risposta insoddisfacente alla tua segnalazione, puoi contattare il 
            Difensore Civico Digitale di AgID:
          </p>
          <a 
            href="https://www.agid.gov.it/it/agenzia/difensore-civico-digitale"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            agid.gov.it — Difensore Civico Digitale
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </section>

        <section className="mt-12 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Ultimo aggiornamento:</strong> {ultimoAggiornamento}
          </p>
        </section>
      </article>
    </div>
  );
}
