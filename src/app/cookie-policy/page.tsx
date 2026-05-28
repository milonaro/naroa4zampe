'use client';

import PolicyLayout from '@/components/PolicyLayout';
import PolicySection from '@/components/PolicySection';
import PolicyInfoBox from '@/components/PolicyInfoBox';

export default function CookiePolicyPage() {
  const today = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return (
    <PolicyLayout
      title="Cookie Policy"
      subtitle="Informativa sull'uso dei cookie e delle tecnologie di tracciamento"
      lastUpdated={today}
    >
      {/* Cosa sono i cookie */}
      <PolicySection title="Cosa sono i cookie">
        <p className="text-amber-900/80">
          I cookie sono piccoli file di testo che i siti visitati dall&apos;utente inviano 
          al suo terminale (di solito al browser), dove vengono memorizzati per essere 
          poi ritrasmessi agli stessi siti alla successiva visita dello stesso utente.
        </p>
      </PolicySection>

      {/* Tipologie di cookie */}
      <PolicySection title="Tipologie di cookie utilizzati">
        <PolicyInfoBox>
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Cookie Tecnici (Necessari)</h3>
          <p className="text-amber-900/80 mb-2">
            Questi cookie sono essenziali per il corretto funzionamento della piattaforma e 
            non possono essere disabilitati. Vengono utilizzati per:
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-900/80 mb-2">
            <li>Gestire la sessione di autenticazione dell&apos;utente</li>
            <li>Memorizzare le preferenze di lingua e accessibilità</li>
            <li>Garantire la sicurezza delle transazioni</li>
            <li>Bilanciare il carico sui server</li>
          </ul>
          <p className="text-sm text-amber-700/75">
            <strong className="text-yellow-800">Base giuridica:</strong> art. 6(1)(e) GDPR
          </p>
        </PolicyInfoBox>

        <PolicyInfoBox className="mt-4">
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Cookie Analitici (Anonimi)</h3>
          <p className="text-amber-900/80 mb-2">
            La piattaforma potrebbe utilizzare cookie analitici anonimizzati per raccogliere 
            informazioni statistiche sull&apos;utilizzo del sito.
          </p>
          <p className="text-sm text-amber-700/75">
            <strong className="text-yellow-800">Nota:</strong> Non utilizziamo cookie analitici di terze parti.
          </p>
        </PolicyInfoBox>

        <PolicyInfoBox className="mt-4">
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Cookie di Profilazione</h3>
          <p className="text-amber-900/80">
            <strong>Non utilizziamo cookie di profilazione.</strong> Nessun dato viene raccolto per creare profili utente.
          </p>
        </PolicyInfoBox>
      </PolicySection>

      {/* Gestione preferenze */}
      <PolicySection title="Gestione delle preferenze">
        <p className="text-amber-900/80 mb-4">
          L&apos;utente può gestire le proprie preferenze relative ai cookie attraverso le impostazioni del browser:
        </p>
        <ul className="list-disc list-inside space-y-2 text-amber-900/80 mb-4">
          <li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" className="text-yellow-700 hover:underline font-medium">
              Google Chrome
            </a>
          </li>
          <li>
            <a href="https://support.mozilla.org/it/kb/Eliminare%20i%20cookie" target="_blank" rel="noopener" className="text-yellow-700 hover:underline font-medium">
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener" className="text-yellow-700 hover:underline font-medium">
              Apple Safari
            </a>
          </li>
          <li>
            <a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener" className="text-yellow-700 hover:underline font-medium">
              Microsoft Edge
            </a>
          </li>
        </ul>
        <p className="text-sm text-amber-700/75">
          Si precisa che la disabilitazione dei cookie tecnici potrebbe compromettere il corretto funzionamento della piattaforma.
        </p>
      </PolicySection>

      {/* Diritti interessato */}
      <PolicySection title="Diritti dell'interessato">
        <p className="text-amber-900/80 mb-4">
          Per esercitare i propri diritti in materia di protezione dei dati personali:
        </p>
        <PolicyInfoBox>
          <p className="text-amber-900/80">
            <strong className="text-yellow-800">Comune di Naro</strong><br />
            Email: <a href="mailto:protocollo@comune.naro.ag.it" className="text-yellow-700 hover:underline font-medium">protocollo@comune.naro.ag.it</a><br />
            PEC: <a href="mailto:protocollo.comune.naro@pec.it" className="text-yellow-700 hover:underline font-medium">protocollo.comune.naro@pec.it</a>
          </p>
        </PolicyInfoBox>
      </PolicySection>
    </PolicyLayout>
  );
}
