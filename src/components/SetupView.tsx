// SetupView - Wizard iniziale per configurare il comune
// Mostrato solo se setupCompletato = false nel record Comune
// Permette di personalizzare nome, coordinate, contatti e credenziali

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  MapPin,
  Phone,
  Shield,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  PawPrint,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

type Step = 'identita' | 'geografia' | 'contatti' | 'credenziali';

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'identita', label: 'Identità', icon: Building2 },
  { id: 'geografia', label: 'Geografia', icon: MapPin },
  { id: 'contatti', label: 'Contatti', icon: Phone },
  { id: 'credenziali', label: 'Credenziali', icon: Shield },
];

export default function SetupView() {
  const impostaConfigComune = useStore((s) => s.impostaConfigComune);
  const impostaVista = useStore((s) => s.impostaVista);

  const [stepCorrente, setStepCorrente] = useState<Step>('identita');
  const [invioInCorso, setInvioInCorso] = useState(false);

  // Identità
  const [nomeComune, setNomeComune] = useState('');
  const [nomeApp, setNomeApp] = useState('');
  const [slug, setSlug] = useState('');

  // Geografia
  const [latCentro, setLatCentro] = useState('');
  const [lngCentro, setLngCentro] = useState('');
  const [raggioKm, setRaggioKm] = useState('10');
  const [regione, setRegione] = useState('');
  const [provincia, setProvincia] = useState('');

  // Contatti
  const [telefonoEmergenza, setTelefonoEmergenza] = useState('');
  const [telefonoVeterinaria, setTelefonoVeterinaria] = useState('');
  const [emailComune, setEmailComune] = useState('');

  // Credenziali (3 ruoli minimi)
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('');
  const [poliziaUser, setPoliziaUser] = useState('polizia');
  const [poliziaPass, setPoliziaPass] = useState('');
  const [ufficioUser, setUfficioUser] = useState('ufficio');
  const [ufficioPass, setUfficioPass] = useState('');

  const stepIndex = steps.findIndex((s) => s.id === stepCorrente);
  const progresso = (stepIndex / (steps.length - 1)) * 100;

  const vaiAvanti = () => {
    const idx = stepIndex;
    if (idx < steps.length - 1) setStepCorrente(steps[idx + 1].id);
  };

  const vaiIndietro = () => {
    const idx = stepIndex;
    if (idx > 0) setStepCorrente(steps[idx - 1].id);
  };

  const validaStep = (): boolean => {
    switch (stepCorrente) {
      case 'identita':
        if (!nomeComune.trim() || !nomeApp.trim() || !slug.trim()) {
          toast.error('Compila tutti i campi obbligatori');
          return false;
        }
        return true;
      case 'geografia':
        const lat = parseFloat(latCentro);
        const lng = parseFloat(lngCentro);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          toast.error('Coordinate non valide');
          return false;
        }
        return true;
      case 'contatti':
        return true; // Contatti sono opzionali
      case 'credenziali':
        if (!adminPass || !poliziaPass || !ufficioPass) {
          toast.error('Tutte le password sono obbligatorie');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const completaSetup = async () => {
    setInvioInCorso(true);
    try {
      const payload = {
        nomeComune: nomeComune.trim(),
        nomeApp: nomeApp.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        latCentro: parseFloat(latCentro),
        lngCentro: parseFloat(lngCentro),
        raggioKm: parseFloat(raggioKm) || 10,
        regione: regione.trim() || 'Sicilia',
        provincia: provincia.trim().toUpperCase() || 'AG',
        telefonoEmergenza: telefonoEmergenza.trim() || undefined,
        telefonoVeterinaria: telefonoVeterinaria.trim() || undefined,
        emailComune: emailComune.trim() || undefined,
        colorePrimario: 'yellow',
        credenziali: [
          { username: adminUser, password: adminPass, nome: 'Amministratore', ruolo: 'amministratore' },
          { username: poliziaUser, password: poliziaPass, nome: 'Polizia Municipale', ruolo: 'polizia' },
          { username: ufficioUser, password: ufficioPass, nome: 'Ufficio Animali', ruolo: 'ufficio' },
        ],
      };

      const r = await fetch('/api/comune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.errore || 'Errore nel salvataggio');
      }

      // Ricarica la configurazione
      const configR = await fetch('/api/comune');
      if (configR.ok) {
        const config = await configR.json();
        impostaConfigComune(config);
      }

      toast.success('Configurazione completata!', {
        description: `${nomeApp} è pronto per l'uso.`,
        duration: 5000,
      });

      impostaVista('home');
    } catch (err) {
      toast.error('Errore nel setup', {
        description: err instanceof Error ? err.message : 'Riprova',
      });
    } finally {
      setInvioInCorso(false);
    }
  };

  const StepIcon = steps[stepIndex].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30">
            <PawPrint className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-yellow-800">Configurazione Iniziale</h1>
          <p className="text-yellow-600 mt-2">Personalizza l&apos;app per il tuo Comune</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, i) => {
              const SIcon = step.icon;
              const completato = i < stepIndex;
              const attivo = i === stepIndex;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    completato ? 'bg-emerald-500 border-emerald-500 text-white' :
                    attivo ? 'bg-yellow-600 border-yellow-600 text-white' :
                    'bg-white border-yellow-200 text-yellow-300'
                  }`}>
                    {completato ? <Check className="h-5 w-5" /> : <SIcon className="h-4.5 w-4.5" />}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-12 sm:w-20 h-0.5 mx-1 ${completato ? 'bg-emerald-400' : 'bg-yellow-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progresso} className="h-1.5 bg-yellow-200 [&>div]:bg-yellow-600" />
          <p className="text-xs text-yellow-500 mt-1 text-center">
            Passo {stepIndex + 1} di {steps.length} — {steps[stepIndex].label}
          </p>
        </div>

        {/* Card contenuto */}
        <Card className="border-yellow-200/60 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600">
                <StepIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-yellow-800">{steps[stepIndex].label}</CardTitle>
                <CardDescription>
                  {stepCorrente === 'identita' && 'Nome del comune e dell\'applicazione'}
                  {stepCorrente === 'geografia' && 'Coordinate del centro abitato e area operativa'}
                  {stepCorrente === 'contatti' && 'Numeri di emergenza e contatti istituzionali'}
                  {stepCorrente === 'credenziali' && 'Credenziali di accesso per gli operatori'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* IDENTITA */}
            {stepCorrente === 'identita' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-yellow-700 font-medium">Nome del Comune *</Label>
                  <Input placeholder="es. Comune di Naro" value={nomeComune} onChange={(e) => setNomeComune(e.target.value)} className="h-11 border-yellow-200 focus:border-yellow-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-yellow-700 font-medium">Nome dell&apos;App *</Label>
                  <Input placeholder="es. Naro a 4 Zampe" value={nomeApp} onChange={(e) => setNomeApp(e.target.value)} className="h-11 border-yellow-200 focus:border-yellow-500" />
                  <p className="text-xs text-yellow-500">Suggerimento: usa il formato &quot;NomeComune a 4 Zampe&quot;</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-yellow-700 font-medium">Slug (identificativo) *</Label>
                  <Input placeholder="es. naro" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="h-11 border-yellow-200 focus:border-yellow-500 font-mono" />
                  <p className="text-xs text-yellow-500">Solo lettere minuscole, numeri e trattini</p>
                </div>
              </motion.div>
            )}

            {/* GEOGRAFIA */}
            {stepCorrente === 'geografia' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-yellow-700 font-medium">Latitudine centro *</Label>
                    <Input type="number" step="0.0001" placeholder="37.2964" value={latCentro} onChange={(e) => setLatCentro(e.target.value)} className="h-11 border-yellow-200 focus:border-yellow-500 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-yellow-700 font-medium">Longitudine centro *</Label>
                    <Input type="number" step="0.0001" placeholder="13.7764" value={lngCentro} onChange={(e) => setLngCentro(e.target.value)} className="h-11 border-yellow-200 focus:border-yellow-500 font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-yellow-700 font-medium">Raggio operativo (km)</Label>
                  <Input type="number" step="1" value={raggioKm} onChange={(e) => setRaggioKm(e.target.value)} className="h-11 border-yellow-200 focus:border-yellow-500" />
                  <p className="text-xs text-yellow-500">Distanza massima dal centro per accettare segnalazioni</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-yellow-700 font-medium">Regione</Label>
                    <Input placeholder="es. Sicilia" value={regione} onChange={(e) => setRegione(e.target.value)} className="h-11 border-yellow-200 focus:border-yellow-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-yellow-700 font-medium">Provincia (sigla)</Label>
                    <Input placeholder="es. AG" maxLength={2} value={provincia} onChange={(e) => setProvincia(e.target.value.toUpperCase())} className="h-11 border-yellow-200 focus:border-yellow-500 font-mono" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* CONTATTI */}
            {stepCorrente === 'contatti' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-yellow-700 font-medium flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> Telefono Emergenza
                  </Label>
                  <Input placeholder="es. 0922 411111" value={telefonoEmergenza} onChange={(e) => setTelefonoEmergenza(e.target.value)} className="h-11 border-yellow-200 focus:border-yellow-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-yellow-700 font-medium flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> Telefono Guardia Veterinaria
                  </Label>
                  <Input placeholder="es. 0922 412222" value={telefonoVeterinaria} onChange={(e) => setTelefonoVeterinaria(e.target.value)} className="h-11 border-yellow-200 focus:border-yellow-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-yellow-700 font-medium flex items-center gap-1.5">
                    <Mail className="h-4 w-4" /> Email Comune
                  </Label>
                  <Input type="email" placeholder="es. comune@comune.naro.it" value={emailComune} onChange={(e) => setEmailComune(e.target.value)} className="h-11 border-yellow-200 focus:border-yellow-500" />
                </div>
              </motion.div>
            )}

            {/* CREDENZIALI */}
            {stepCorrente === 'credenziali' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  Imposta le credenziali per gli operatori del Comune. Potrai aggiungerne altri dalla Dashboard.
                </p>

                {/* Admin */}
                <div className="space-y-2 p-3 rounded-lg border border-yellow-100 bg-yellow-50/50">
                  <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">Amministratore</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Username" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="h-9 border-yellow-200 text-xs" />
                    <Input placeholder="Password *" type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="h-9 border-yellow-200 text-xs" />
                  </div>
                </div>

                {/* Polizia */}
                <div className="space-y-2 p-3 rounded-lg border border-yellow-100 bg-yellow-50/50">
                  <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">Polizia Municipale</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Username" value={poliziaUser} onChange={(e) => setPoliziaUser(e.target.value)} className="h-9 border-yellow-200 text-xs" />
                    <Input placeholder="Password *" type="password" value={poliziaPass} onChange={(e) => setPoliziaPass(e.target.value)} className="h-9 border-yellow-200 text-xs" />
                  </div>
                </div>

                {/* Ufficio */}
                <div className="space-y-2 p-3 rounded-lg border border-yellow-100 bg-yellow-50/50">
                  <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">Ufficio Animali</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Username" value={ufficioUser} onChange={(e) => setUfficioUser(e.target.value)} className="h-9 border-yellow-200 text-xs" />
                    <Input placeholder="Password *" type="password" value={ufficioPass} onChange={(e) => setUfficioPass(e.target.value)} className="h-9 border-yellow-200 text-xs" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigazione */}
            <div className="flex items-center justify-between pt-4 border-t border-yellow-100">
              <Button
                variant="ghost"
                onClick={vaiIndietro}
                disabled={stepIndex === 0}
                className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Indietro
              </Button>

              {stepCorrente === 'credenziali' ? (
                <Button
                  onClick={completaSetup}
                  disabled={invioInCorso}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-md shadow-yellow-600/20"
                >
                  {invioInCorso ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvataggio...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Completa Setup</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => { if (validaStep()) vaiAvanti(); }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-md shadow-yellow-600/20"
                >
                  Avanti
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
