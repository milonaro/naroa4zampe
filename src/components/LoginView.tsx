// Componente LoginView - Schermata di accesso per la Dashboard amministrativa
// Include form con username e password, validazione e feedback visivo

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dog, Lock, User, Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function LoginView() {
  const { loginAdmin } = useStore();
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
      loginAdmin(dati.nome);
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
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card className="border-amber-200 shadow-xl shadow-amber-900/10 overflow-hidden">
          {/* Banner superiore */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 p-6 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold">Area Riservata</h2>
            <p className="text-amber-100 text-sm mt-1">Dashboard Amministrativa</p>
          </div>

          <CardContent className="p-6">
            <form onSubmit={gestisciSubmit} className="space-y-5">
              {/* Campo Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-amber-800 font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-600" />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Inserisci il tuo username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/20 pl-10 h-11"
                    autoComplete="username"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                </div>
              </div>

              {/* Campo Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-amber-800 font-medium flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={mostraPassword ? 'text' : 'password'}
                    placeholder="Inserisci la password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/20 pl-10 pr-10 h-11"
                    autoComplete="current-password"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                  <button
                    type="button"
                    onClick={() => setMostraPassword(!mostraPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors"
                  >
                    {mostraPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Pulsante Login */}
              <Button
                type="submit"
                disabled={loginMutazione.isPending}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-amber-600/25"
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
            <div className="mt-5 flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-600 leading-relaxed">
                Accesso riservato al personale autorizzato del Comune di Naro.
                Le credenziali vengono verificate in modo sicuro.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
