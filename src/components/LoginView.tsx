// Componente LoginView - Schermata di accesso per la Dashboard amministrativa
// Design scuro con glassmorphism, griglia animata e branding professionale

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dog, Lock, User, Loader2, Shield, Eye, EyeOff, PawPrint } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function LoginView() {
  const { loginAdmin, configComune } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostraPassword, setMostraPassword] = useState(false);

  // Mutazione per il login
  const loginMutazione = useMutation({
    mutationFn: async (credenziali: { username: string; password: string }) => {
      const risposta = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenziali),
      });
      const dati = await risposta.json();
      if (!dati.successo) {
        throw new Error(dati.errore || 'Credenziali non valide');
      }
      return dati;
    },
    onSuccess: (dati) => {
      loginAdmin(dati.nome, dati.username, dati.ruolo);
      toast.success(dati.messaggio || 'Accesso riuscito!');
    },
    onError: (errore) => {
      toast.error('Accesso negato', {
        description: errore.message || 'Username o password non corretti',
      });
    },
  });

  const gestisciSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Compila tutti i campi');
      return;
    }
    loginMutazione.mutate({ username, password });
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 login-scuro relative overflow-hidden rounded-xl">
      {/* Griglia animata di sfondo */}
      <div className="absolute inset-0 pattern-griglia-scuro" />

      {/* Decorazioni sfondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl" />
        <PawPrint className="absolute top-16 right-16 h-16 w-16 text-yellow-500/[0.04]" />
        <PawPrint className="absolute bottom-20 left-12 h-12 w-12 text-yellow-500/[0.03]" />
        <Shield className="absolute top-1/3 left-[10%] h-20 w-20 text-yellow-500/[0.03]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glassmorphism-scuro shadow-2xl shadow-black/30 overflow-hidden">
          {/* Banner superiore scuro */}
          <div className="relative bg-gradient-to-r from-yellow-700/80 via-yellow-600/80 to-yellow-700/80 p-6 text-center text-white overflow-hidden">
            {/* Sfondo del banner */}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 pattern-griglia opacity-30" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 border border-white/20 shadow-lg"
              >
                <Shield className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold">Area Riservata</h2>
              <p className="text-yellow-200/80 text-sm mt-1">{configComune.nomeApp} &mdash; Dashboard Amministrativa</p>
            </div>
          </div>

          <CardContent className="p-6 bg-gradient-to-b from-gray-900/90 to-gray-950/95">
            <form onSubmit={gestisciSubmit} className="space-y-5">
              {/* Campo Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-yellow-200/90 font-medium flex items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5 text-yellow-400" />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Inserisci il tuo username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-yellow-500/20 focus:border-yellow-500/50 focus:ring-yellow-500/20 pl-10 h-11 text-yellow-100 placeholder:text-yellow-300/30 transition-colors"
                    autoComplete="username"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-400/60" />
                </div>
              </div>

              {/* Campo Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-yellow-200/90 font-medium flex items-center gap-1.5 text-sm">
                  <Lock className="h-3.5 w-3.5 text-yellow-400" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={mostraPassword ? 'text' : 'password'}
                    placeholder="Inserisci la password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-yellow-500/20 focus:border-yellow-500/50 focus:ring-yellow-500/20 pl-10 pr-10 h-11 text-yellow-100 placeholder:text-yellow-300/30 transition-colors"
                    autoComplete="current-password"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-400/60" />
                  <button
                    type="button"
                    onClick={() => setMostraPassword(!mostraPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400/60 hover:text-yellow-300 transition-colors"
                  >
                    {mostraPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Pulsante Login */}
              <Button
                type="submit"
                disabled={loginMutazione.isPending}
                className="w-full h-11 bg-gradient-to-r from-yellow-600 to-yellow-600 hover:from-yellow-500 hover:to-yellow-500 text-white font-semibold text-base transition-all duration-300 hover:shadow-lg hover:shadow-yellow-600/25 hover:scale-[1.01]"
              >
                {loginMutazione.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifica in corso...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Accedi alla Dashboard
                  </>
                )}
              </Button>
            </form>

            {/* Info sicurezza */}
            <div className="mt-5 flex items-start gap-2 p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
              <Shield className="h-4 w-4 text-yellow-400/70 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-300/50 leading-relaxed">
                Accesso riservato al personale autorizzato del {configComune.nomeComune}.
                Le credenziali vengono verificate in modo sicuro.
              </p>
            </div>

            {/* Branding inferiore */}
            <div className="mt-4 pt-4 border-t border-yellow-500/10 text-center">
              <div className="flex items-center justify-center gap-1.5 text-yellow-400/30">
                <PawPrint className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">{configComune.nomeApp}</span>
                <PawPrint className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
