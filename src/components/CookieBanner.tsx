// Cookie Banner GDPR-compliant
// Appare al primo accesso e permette di accettare/rifiutare cookie
// Salva la scelta in localStorage

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState({
    necessari: true, // sempre attivi
    analitici: false,
    marketing: false
  });

  useEffect(() => {
    // Controlla se l'utente ha già espresso le preferenze
    const saved = localStorage.getItem('cookie-consent');
    if (!saved) {
      // Mostra il banner dopo un breve delay
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      accettati: true,
      data: new Date().toISOString(),
      preferences
    }));
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      accettati: false,
      data: new Date().toISOString(),
      preferences: { necessari: true, analitici: false, marketing: false }
    }));
    setShowBanner(false);
  };

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === 'necessari') return; // non disattivabili
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-yellow-200 shadow-lg p-4 sm:p-6"
      role="region"
      aria-label="Cookie banner"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col gap-4">
          {/* Titolo e descrizione */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                Questo sito utilizza i cookie
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Utilizziamo solo cookie tecnici necessari per il funzionamento del servizio. 
                Non utilizziamo cookie di profilazione o marketing.
                Per maggiori informazioni, consulta la nostra{' '}
                <Link href="/cookie-policy" className="text-primary hover:underline" target="_blank">
                  Cookie Policy
                </Link>.
              </p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Chiudi banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preferenze granulari */}
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="rounded border-gray-300"
              />
              <span>Cookies tecnici (necessari) - Sempre attivi</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.analitici}
                onChange={() => togglePreference('analitici')}
                className="rounded border-gray-300"
              />
              <span>Cookies analitici anonimi (opzionale)</span>
            </label>
          </div>

          {/* Pulsanti azione */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleReject}
              variant="outline"
              size="sm"
              className="border-gray-300"
            >
              Rifiuta tutti
            </Button>
            <Button
              onClick={handleAccept}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Accetta tutti
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
