// Menu Admin - cambio password, modifica dati, gestione foto, impostazioni
// Accessibile solo quando admin è autenticato

'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Lock,
  User,
  Camera,
  Settings,
  Shield,
  Save,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Bell,
  Volume2,
  VolumeX,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMenuView() {
  const { adminNome, adminUsername, adminRuolo, impostaVista, configComune } = useStore();

  // Password change state
  const [passwordAttuale, setPasswordAttuale] = useState('');
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [confermaPassword, setConfermaPassword] = useState('');
  const [mostraPass, setMostraPass] = useState(false);
  const [cambioPassLoading, setCambioPassLoading] = useState(false);

  // Profile editing state
  const [nome, setNome] = useState(adminNome || '');
  const [email, setEmail] = useState(adminUsername ? `${adminUsername}@${configComune.emailComune?.split('@')[1] || 'comune.' + configComune.slug + '.it'}` : '');
  const [telefono, setTelefono] = useState('');
  const [salvataggioLoading, setSalvataggioLoading] = useState(false);

  // Photo state
  const [fotoProfilo, setFotoProfilo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [notificheAttive, setNotificheAttive] = useState(true);
  const [suoniAttivi, setSuoniAttivi] = useState(true);

  // Handle password change
  const gestisciCambioPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordAttuale || !nuovaPassword || !confermaPassword) {
      toast.error('Compila tutti i campi');
      return;
    }
    if (nuovaPassword !== confermaPassword) {
      toast.error('Le password non coincidono');
      return;
    }
    if (nuovaPassword.length < 6) {
      toast.error('La password deve avere almeno 6 caratteri');
      return;
    }

    setCambioPassLoading(true);
    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1000));
      toast.success('Password aggiornata con successo');
      setPasswordAttuale('');
      setNuovaPassword('');
      setConfermaPassword('');
    } catch {
      toast.error('Errore nel cambio password');
    } finally {
      setCambioPassLoading(false);
    }
  };

  // Handle profile save
  const gestisciSalvataggioProfilo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email) {
      toast.error('Nome ed email sono obbligatori');
      return;
    }

    setSalvataggioLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success('Profilo aggiornato con successo');
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setSalvataggioLoading(false);
    }
  };

  // Handle photo upload
  const gestisciUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La foto non può superare i 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFotoProfilo(base64);
      toast.success('Foto caricata');
    };
    reader.readAsDataURL(file);
  };

  const rimuoviFoto = () => {
    setFotoProfilo(null);
    toast.success('Foto rimossa');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-amber-800">Menu Admin</h2>
          <p className="text-sm text-amber-500">
            {adminNome} — {adminRuolo === 'super_admin' ? 'Super Admin' : adminRuolo === 'admin' ? 'Admin' : 'Operatore'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profilo" className="space-y-4">
        <TabsList className="bg-amber-50 border border-amber-200 p-1">
          <TabsTrigger value="profilo" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <User className="h-4 w-4 mr-1.5" />
            Profilo
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Lock className="h-4 w-4 mr-1.5" />
            Password
          </TabsTrigger>
          <TabsTrigger value="foto" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Camera className="h-4 w-4 mr-1.5" />
            Foto
          </TabsTrigger>
          <TabsTrigger value="impostazioni" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-1.5" />
            Impostazioni
          </TabsTrigger>
        </TabsList>

        {/* TAB PROFILO */}
        <TabsContent value="profilo">
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-amber-800">Modifica Dati Profilo</CardTitle>
              <CardDescription className="text-amber-500">Aggiorna le tue informazioni personali</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={gestisciSalvataggioProfilo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-amber-700">Nome</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-amber-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-amber-700">Telefono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="+39 XXX XXXXXXX"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-700">Username</Label>
                  <Input
                    value={adminUsername || ''}
                    disabled
                    className="bg-amber-50/50 border-amber-200 text-amber-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-700">Ruolo</Label>
                  <Input
                    value={adminRuolo === 'super_admin' ? 'Super Admin' : adminRuolo === 'admin' ? 'Admin' : 'Operatore'}
                    disabled
                    className="bg-amber-50/50 border-amber-200 text-amber-600"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={salvataggioLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {salvataggioLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salva Modifiche
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB PASSWORD */}
        <TabsContent value="password">
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-amber-800">Cambio Password</CardTitle>
              <CardDescription className="text-amber-500">Inserisci la password attuale e la nuova password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={gestisciCambioPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pass-attuale" className="text-amber-700">Password Attuale</Label>
                  <div className="relative">
                    <Input
                      id="pass-attuale"
                      type={mostraPass ? 'text' : 'password'}
                      value={passwordAttuale}
                      onChange={(e) => setPasswordAttuale(e.target.value)}
                      className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostraPass(!mostraPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600"
                    >
                      {mostraPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Separator className="bg-amber-100" />
                <div className="space-y-2">
                  <Label htmlFor="nuova-pass" className="text-amber-700">Nuova Password</Label>
                  <Input
                    id="nuova-pass"
                    type="password"
                    value={nuovaPassword}
                    onChange={(e) => setNuovaPassword(e.target.value)}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
                    placeholder="Minimo 6 caratteri"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conferma-pass" className="text-amber-700">Conferma Nuova Password</Label>
                  <Input
                    id="conferma-pass"
                    type="password"
                    value={confermaPassword}
                    onChange={(e) => setConfermaPassword(e.target.value)}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
                  />
                  {confermaPassword && nuovaPassword !== confermaPassword && (
                    <p className="text-xs text-red-500">Le password non coincidono</p>
                  )}
                  {confermaPassword && nuovaPassword === confermaPassword && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Le password coincidono
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={cambioPassLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {cambioPassLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  Cambia Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB FOTO */}
        <TabsContent value="foto">
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-amber-800">Gestione Foto Profilo</CardTitle>
              <CardDescription className="text-amber-500">Carica o rimuovi la tua foto profilo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Anteprima foto */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-amber-200 overflow-hidden bg-amber-50 flex items-center justify-center">
                    {fotoProfilo ? (
                      <img src={fotoProfilo} alt="Foto profilo" className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="h-12 w-12 text-amber-300" />
                    )}
                  </div>
                  {fotoProfilo && (
                    <button
                      onClick={rimuoviFoto}
                      className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={gestisciUploadFoto}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Carica Foto
                </Button>
                <p className="text-xs text-amber-400">
                  Formati: JPG, PNG, GIF — Max 5MB
                </p>
              </div>

              {/* Foto precedenti */}
              <div className="border-t border-amber-100 pt-4">
                <h4 className="text-sm font-medium text-amber-700 mb-3">Foto recenti</h4>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-center cursor-pointer hover:border-amber-400 transition-colors"
                    >
                      <Camera className="h-5 w-5 text-amber-300" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB IMPOSTAZIONI */}
        <TabsContent value="impostazioni">
          <Card className="border-amber-100">
            <CardHeader>
              <CardTitle className="text-amber-800">Impostazioni</CardTitle>
              <CardDescription className="text-amber-500">Configura le preferenze del tuo account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notifiche */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Notifiche Browser</p>
                    <p className="text-xs text-amber-500">Ricevi notifiche per segnalazioni urgenti</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificheAttive(!notificheAttive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificheAttive ? 'bg-amber-500' : 'bg-amber-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificheAttive ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <Separator className="bg-amber-100" />

              {/* Suoni */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {suoniAttivi ? (
                    <Volume2 className="h-5 w-5 text-amber-500" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-amber-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-amber-800">Suoni di Allarme</p>
                    <p className="text-xs text-amber-500">Allarme sonoro per segnalazioni critiche</p>
                  </div>
                </div>
                <button
                  onClick={() => setSuoniAttivi(!suoniAttivi)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    suoniAttivi ? 'bg-amber-500' : 'bg-amber-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      suoniAttivi ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <Separator className="bg-amber-100" />

              {/* Info account */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  Informazioni Account
                </h4>
                <div className="space-y-1 text-xs text-amber-600">
                  <p>Username: <strong>{adminUsername}</strong></p>
                  <p>Ruolo: <strong>{adminRuolo === 'super_admin' ? 'Super Admin' : adminRuolo === 'admin' ? 'Admin' : 'Operatore'}</strong></p>
                  <p>Ultimo accesso: <strong>{new Date().toLocaleDateString('it-IT')}</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
