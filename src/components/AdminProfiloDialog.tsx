// Componente AdminProfiloDialog - Dialog per gestione profilo admin
// Include tab Profilo e Sicurezza per modificare dati personali e password

'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Lock, Save, Mail, Phone, Camera, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminProfiloDialog() {
  const { profiloAdminAperto, impostaProfiloAdmin, adminNome, adminUsername, adminEmail, adminTelefono, adminFoto, adminRuolo, loginAdmin } = useStore();

  // Profilo state
  const [nome, setNome] = useState(adminNome || '');
  const [email, setEmail] = useState(adminEmail || '');
  const [telefono, setTelefono] = useState(adminTelefono || '');
  const [foto, setFoto] = useState(adminFoto || '');

  // Sicurezza state
  const [passwordAttuale, setPasswordAttuale] = useState('');
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [confermaPassword, setConfermaPassword] = useState('');
  const [mostraPasswordAttuale, setMostraPasswordAttuale] = useState(false);
  const [mostraNuovaPassword, setMostraNuovaPassword] = useState(false);

  // Salvataggio state
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);

  // Sync state when dialog opens
  useEffect(() => {
    if (profiloAdminAperto) {
      setNome(adminNome || '');
      setEmail(adminEmail || '');
      setTelefono(adminTelefono || '');
      setFoto(adminFoto || '');
      setPasswordAttuale('');
      setNuovaPassword('');
      setConfermaPassword('');
    }
  }, [profiloAdminAperto, adminNome, adminEmail, adminTelefono, adminFoto]);

  // Salvataggio profilo
  const salvaProfilo = async () => {
    setSalvataggioInCorso(true);
    try {
      // Simula salvataggio (localStorage per demo)
      const profiloData = { nome, email, telefono, foto };
      localStorage.setItem('naro4zampe-admin-profilo', JSON.stringify(profiloData));

      // Aggiorna lo store
      loginAdmin(nome, adminUsername || undefined, email, telefono, foto, adminRuolo || undefined);

      toast.success('Profilo aggiornato', { description: 'Le modifiche sono state salvate con successo' });
    } catch {
      toast.error('Errore', { description: 'Impossibile salvare le modifiche' });
    } finally {
      setSalvataggioInCorso(false);
    }
  };

  // Cambio password
  const cambiaPassword = async () => {
    if (!passwordAttuale || !nuovaPassword || !confermaPassword) {
      toast.error('Compila tutti i campi');
      return;
    }
    if (nuovaPassword !== confermaPassword) {
      toast.error('Le password non coincidono', { description: 'Verifica che la nuova password e la conferma siano identiche' });
      return;
    }
    if (nuovaPassword.length < 6) {
      toast.error('Password troppo corta', { description: 'La nuova password deve avere almeno 6 caratteri' });
      return;
    }

    setSalvataggioInCorso(true);
    try {
      // Simula cambio password
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Password aggiornata', { description: 'La tua password è stata modificata con successo' });
      setPasswordAttuale('');
      setNuovaPassword('');
      setConfermaPassword('');
    } catch {
      toast.error('Errore', { description: 'Impossibile aggiornare la password' });
    } finally {
      setSalvataggioInCorso(false);
    }
  };

  // Upload foto (simulato)
  const gestisciFoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setFoto(result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Etichetta ruolo
  const etichettaRuolo = (ruolo: string | null) => {
    switch (ruolo) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Amministratore';
      case 'operatore': return 'Operatore';
      case 'consultatore': return 'Consultatore';
      default: return 'Operatore';
    }
  };

  return (
    <Dialog open={profiloAdminAperto} onOpenChange={impostaProfiloAdmin}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sand-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-sand-600" />
            Profilo Operatore
          </DialogTitle>
          <DialogDescription>
            Gestisci le tue informazioni personali e le impostazioni di sicurezza
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profilo" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="profilo" className="flex-1 gap-1.5">
              <User className="h-3.5 w-3.5" />
              Profilo
            </TabsTrigger>
            <TabsTrigger value="sicurezza" className="flex-1 gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Sicurezza
            </TabsTrigger>
          </TabsList>

          {/* Tab Profilo */}
          <TabsContent value="profilo" className="space-y-4 mt-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="h-20 w-20 rounded-full bg-sand-100 border-2 border-sand-300 flex items-center justify-center overflow-hidden">
                  {foto ? (
                    <img src={foto} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <Shield className="h-8 w-8 text-sand-400" />
                  )}
                </div>
                <button
                  onClick={gestisciFoto}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  aria-label="Cambia foto profilo"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-sand-800">{adminNome}</p>
                <p className="text-sm text-sand-500">@{adminUsername}</p>
                <p className="text-xs text-sand-400 mt-0.5 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {etichettaRuolo(adminRuolo)}
                </p>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-nome" className="text-sand-700 flex items-center gap-1.5 text-sm">
                <User className="h-3.5 w-3.5 text-sand-500" />
                Nome completo
              </Label>
              <Input
                id="admin-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="border-sand-200 focus:border-sand-400 focus:ring-sand-400/20"
                placeholder="Il tuo nome completo"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-sand-700 flex items-center gap-1.5 text-sm">
                <Mail className="h-3.5 w-3.5 text-sand-500" />
                Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-sand-200 focus:border-sand-400 focus:ring-sand-400/20"
                placeholder="nome@comune.it"
              />
            </div>

            {/* Telefono */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-telefono" className="text-sand-700 flex items-center gap-1.5 text-sm">
                <Phone className="h-3.5 w-3.5 text-sand-500" />
                Telefono
              </Label>
              <Input
                id="admin-telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="border-sand-200 focus:border-sand-400 focus:ring-sand-400/20"
                placeholder="+39 ..."
              />
            </div>

            {/* Salva profilo */}
            <Button
              onClick={salvaProfilo}
              disabled={salvataggioInCorso}
              className="w-full bg-sand-600 hover:bg-sand-700 text-white"
            >
              {salvataggioInCorso ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salva Modifiche
                </>
              )}
            </Button>
          </TabsContent>

          {/* Tab Sicurezza */}
          <TabsContent value="sicurezza" className="space-y-4 mt-4">
            <div className="bg-sand-50 rounded-lg p-3 border border-sand-100">
              <p className="text-xs text-sand-600 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Per motivi di sicurezza, inserisci la tua password attuale prima di impostarne una nuova.
              </p>
            </div>

            {/* Password attuale */}
            <div className="space-y-1.5">
              <Label htmlFor="password-attuale" className="text-sand-700 text-sm">
                Password attuale
              </Label>
              <div className="relative">
                <Input
                  id="password-attuale"
                  type={mostraPasswordAttuale ? 'text' : 'password'}
                  value={passwordAttuale}
                  onChange={(e) => setPasswordAttuale(e.target.value)}
                  className="border-sand-200 focus:border-sand-400 focus:ring-sand-400/20 pr-10"
                  placeholder="Inserisci la password attuale"
                />
                <button
                  type="button"
                  onClick={() => setMostraPasswordAttuale(!mostraPasswordAttuale)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600 transition-colors"
                >
                  {mostraPasswordAttuale ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Nuova password */}
            <div className="space-y-1.5">
              <Label htmlFor="nuova-password" className="text-sand-700 text-sm">
                Nuova password
              </Label>
              <div className="relative">
                <Input
                  id="nuova-password"
                  type={mostraNuovaPassword ? 'text' : 'password'}
                  value={nuovaPassword}
                  onChange={(e) => setNuovaPassword(e.target.value)}
                  className="border-sand-200 focus:border-sand-400 focus:ring-sand-400/20 pr-10"
                  placeholder="Almeno 6 caratteri"
                />
                <button
                  type="button"
                  onClick={() => setMostraNuovaPassword(!mostraNuovaPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600 transition-colors"
                >
                  {mostraNuovaPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Conferma password */}
            <div className="space-y-1.5">
              <Label htmlFor="conferma-password" className="text-sand-700 text-sm">
                Conferma nuova password
              </Label>
              <Input
                id="conferma-password"
                type="password"
                value={confermaPassword}
                onChange={(e) => setConfermaPassword(e.target.value)}
                className="border-sand-200 focus:border-sand-400 focus:ring-sand-400/20"
                placeholder="Ripeti la nuova password"
              />
              {confermaPassword && nuovaPassword && confermaPassword === nuovaPassword && (
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3" />
                  Le password coincidono
                </p>
              )}
              {confermaPassword && nuovaPassword && confermaPassword !== nuovaPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Le password non coincidono
                </p>
              )}
            </div>

            {/* Cambia password */}
            <Button
              onClick={cambiaPassword}
              disabled={salvataggioInCorso || !passwordAttuale || !nuovaPassword || !confermaPassword}
              className="w-full bg-sand-600 hover:bg-sand-700 text-white"
            >
              {salvataggioInCorso ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Aggiornamento...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Aggiorna Password
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
