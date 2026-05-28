'use client';

import PolicyLayout from '@/components/PolicyLayout';
import PolicySection from '@/components/PolicySection';
import PolicyInfoBox from '@/components/PolicyInfoBox';

export default function AccessibilitaPage() {
  const today = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <PolicyLayout
      title="Dichiarazione di accessibilità"
      subtitle="Conformità alla Legge 4/2004 (Legge Stanca) e al D.Lgs. 106/2018"
      lastUpdated={today}
    >
      {/* Stato di conformità */}
      <PolicySection title="Stato di conformità">
        <p className="text-amber-900/80 mb-4">
          Questo sito è <strong className="text-yellow-700">parzialmente conforme</strong> alle norme EN 301 549 V3.2.1 e alle WCAG 2.1 livello AA, a causa delle non conformità elencate di seguito.
        </p>
      </PolicySection>

      {/* Contenuti non accessibili */}
      <PolicySection title="Contenuti non accessibili">
        <p className="text-amber-900/80 mb-3">
          I seguenti contenuti presentano limitazioni di accessibilità:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 text-amber-900/80">
          <li>
            La mappa interattiva (Leaflet) non è completamente fruibile da screen reader — 
            <strong className="text-yellow-700"> in fase di adeguamento</strong>
          </li>
          <li>
            Alcuni elementi grafici decorativi potrebbero non avere testo alternativo appropriato
          </li>
        </ul>
        <p className="text-sm text-amber-700/75">
          Stiamo lavorando per migliorare costantemente l&apos;accessibilità della piattaforma.
        </p>
      </PolicySection>

      {/* Meccanismo di feedback */}
      <PolicySection title="Meccanismo di feedback">
        <p className="text-amber-900/80 mb-4">
          Per segnalare problemi di accessibilità o richiedere informazioni in formati alternativi:
        </p>
        <PolicyInfoBox>
          <p className="mb-2 text-amber-900/80">
            <strong className="text-yellow-800">Email:</strong>{' '}
            <a 
              href="mailto:protocollo@comune.naro.ag.it" 
              className="text-yellow-700 hover:underline font-medium"
            >
              protocollo@comune.naro.ag.it
            </a>
          </p>
          <p className="text-amber-900/80">
            <strong className="text-yellow-800">PEC:</strong>{' '}
            <a 
              href="mailto:protocollo.comune.naro@pec.it" 
              className="text-yellow-700 hover:underline font-medium"
            >
              protocollo.comune.naro@pec.it
            </a>
          </p>
        </PolicyInfoBox>
      </PolicySection>

      {/* Procedura di attuazione */}
      <PolicySection title="Procedura di attuazione">
        <p className="text-amber-900/80 mb-4">
          In caso di risposta insoddisfacente alla tua segnalazione, puoi contattare il Difensore Civico Digitale di AgID:
        </p>
        <a 
          href="https://www.agid.gov.it/it/agenzia/difensore-civico-digitale"
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-700 hover:underline inline-flex items-center gap-2 font-medium"
        >
          agid.gov.it — Difensore Civico Digitale
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </PolicySection>
    </PolicyLayout>
  );
}
