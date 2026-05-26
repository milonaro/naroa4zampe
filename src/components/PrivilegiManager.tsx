// Gestione Privilegi RBAC - Solo per Super Admin
// Permette di attivare/disattivare livelli di accesso per gli operatori

'use client';

import { useState } from 'react';
import { useStore, PRIVILEGI_DISPONIBILI, ETICHETTE_PRIVILEGI, type Privilegio } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Save,
  UserPlus,
  Crown,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
  Dog,
} from 'lucide-react';
import { toast } from 'sonner';

interface AccountOperatore {
  id: string;
  username: string;
  nome: string;
  ruolo: 'admin' | 'operatore' | 'canile';
  privilegi: Privilegio[];
  attivo: boolean;
}

// Account demo per la UI
const accountDemo: AccountOperatore[] = [
  {
    id: '1',
    username: 'polizia',
    nome: 'Polizia Municipale',
    ruolo: 'admin',
    privilegi: ['segnalazioni_read', 'segnalazioni_write', 'notifiche_manage', 'inserimento_manuale'],
    attivo: true,
  },
  {
    id: '2',
    username: 'ufficio',
    nome: 'Ufficio Canile',
    ruolo: 'operatore',
    privilegi: ['segnalazioni_read', 'utenti_read', 'notifiche_manage'],
    attivo: true,
  },
  {
    id: '3',
    username: 'dogvillage',
    nome: 'DOG Village — Canile',
    ruolo: 'canile',
    privilegi: ['segnalazioni_read', 'segnalazioni_write', 'notifiche_manage'],
    attivo: true,
  },
];

export default function PrivilegiManager() {
  const { isSuperAdmin } = useStore();
  const [accounts, setAccounts] = useState<AccountOperatore[]>(accountDemo);
  const [nuovoUsername, setNuovoUsername] = useState('');
  const [nuovoNome, setNuovoNome] = useState('');
  const [nuovoRuolo, setNuovoRuolo] = useState<'admin' | 'operatore' | 'canile'>('operatore');
  const [creazioneLoading, setCreazioneLoading] = useState(false);

  // Se non è super admin, mostra messaggio
  if (!isSuperAdmin()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldAlert className="h-12 w-12 text-red-400 mb-3" />
          <h3 className="text-lg font-bold text-red-800">Accesso Negato</h3>
          <p className="text-sm text-red-600 mt-1">
            Solo il Super Admin può gestire i privilegi e i livelli di accesso.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Toggle privilegio per un account
  const togglePrivilegio = (accountId: string, privilegio: Privilegio) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const haPrivilegio = acc.privilegi.includes(privilegio);
        return {
          ...acc,
          privilegi: haPrivilegio
            ? acc.privilegi.filter((p) => p !== privilegio)
            : [...acc.privilegi, privilegio],
        };
      })
    );
    toast.success('Privilegio aggiornato');
  };

  // Toggle stato attivo/disattivo account
  const toggleAttivo = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        return { ...acc, attivo: !acc.attivo };
      })
    );
    toast.success('Stato account aggiornato');
  };

  // Crea nuovo account
  const creaNuovoAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoUsername || !nuovoNome) {
      toast.error('Compila tutti i campi');
      return;
    }

    setCreazioneLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const nuovoAccount: AccountOperatore = {
        id: String(Date.now()),
        username: nuovoUsername,
        nome: nuovoNome,
        ruolo: nuovoRuolo,
        privilegi: ['segnalazioni_read'],
        attivo: true,
      };
      setAccounts((prev) => [...prev, nuovoAccount]);
      setNuovoUsername('');
      setNuovoNome('');
      toast.success('Account creato con successo');
    } catch {
      toast.error('Errore nella creazione');
    } finally {
      setCreazioneLoading(false);
    }
  };

  // Elimina account
  const eliminaAccount = (accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    toast.success('Account eliminato');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-100 text-purple-700 border border-purple-200">
          <Crown className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-800">Gestione Privilegi RBAC</h3>
          <p className="text-xs text-amber-500">Solo Super Admin — Attiva/disattiva livelli di accesso</p>
        </div>
      </div>

      {/* Legenda livelli di accesso */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
            <Lock className="h-4 w-4" />
            Livelli di Accesso Disponibili
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PRIVILEGI_DISPONIBILI.map((priv) => (
              <div
                key={priv}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-white/80 rounded-md border border-amber-200"
              >
                <ShieldCheck className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-[11px] text-amber-700">{ETICHETTE_PRIVILEGI[priv]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form creazione account */}
      <Card className="border-amber-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-800 flex items-center gap-1.5">
            <UserPlus className="h-4 w-4" />
            Crea Nuovo Account Operatore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={creaNuovoAccount} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[150px]">
              <Label className="text-xs text-amber-600">Username</Label>
              <Input
                value={nuovoUsername}
                onChange={(e) => setNuovoUsername(e.target.value)}
                placeholder="es. operatore1"
                className="h-9 text-sm border-amber-200 focus:border-amber-500"
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[150px]">
              <Label className="text-xs text-amber-600">Nome Completo</Label>
              <Input
                value={nuovoNome}
                onChange={(e) => setNuovoNome(e.target.value)}
                placeholder="es. Mario Rossi"
                className="h-9 text-sm border-amber-200 focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-amber-600">Ruolo</Label>
              <select
                value={nuovoRuolo}
                onChange={(e) => setNuovoRuolo(e.target.value as 'admin' | 'operatore' | 'canile')}
                className="h-9 text-sm border border-amber-200 rounded-md px-3 bg-white focus:border-amber-500 focus:ring-amber-500/20"
              >
                <option value="operatore">Operatore</option>
                <option value="admin">Admin</option>
                <option value="canile">Canile / Rifugio</option>
              </select>
            </div>
            <Button
              type="submit"
              disabled={creazioneLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white h-9"
            >
              {creazioneLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista account con privilegi */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <Card
            key={account.id}
            className={`border-amber-100 transition-all ${
              !account.attivo ? 'opacity-60 bg-gray-50' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                    account.ruolo === 'canile'
                      ? 'bg-emerald-100 text-emerald-700'
                      : account.ruolo === 'admin'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}>
                    {account.ruolo === 'canile' ? (
                      <Dog className="h-4 w-4" />
                    ) : account.ruolo === 'admin' ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-sm text-amber-800">{account.nome}</CardTitle>
                    <p className="text-xs text-amber-500">@{account.username}</p>
                  </div>
                  <Badge className={`text-[10px] border-0 ${
                    account.ruolo === 'canile'
                      ? 'bg-emerald-100 text-emerald-700'
                      : account.ruolo === 'admin'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}>
                    {account.ruolo === 'canile' ? 'Canile' : account.ruolo === 'admin' ? 'Admin' : 'Operatore'}
                  </Badge>
                  {!account.attivo && (
                    <Badge className="bg-red-100 text-red-700 text-[10px] border-0">
                      <AlertTriangle className="h-3 w-3 mr-0.5" />
                      Disattivo
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Toggle attivo/disattivo */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-amber-600">
                      {account.attivo ? (
                        <Unlock className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </Label>
                    <Switch
                      checked={account.attivo}
                      onCheckedChange={() => toggleAttivo(account.id)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    onClick={() => eliminaAccount(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator className="bg-amber-100 mb-3" />
              <p className="text-xs text-amber-600 mb-2 font-medium">Livelli di Accesso:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {PRIVILEGI_DISPONIBILI.map((priv) => {
                  const attivo = account.privilegi.includes(priv);
                  return (
                    <button
                      key={priv}
                      onClick={() => togglePrivilegio(account.id, priv)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] border transition-all ${
                        attivo
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      <div className={`h-3 w-3 rounded-full border-2 flex items-center justify-center ${
                        attivo ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {attivo && <div className="h-1 w-1 bg-white rounded-full" />}
                      </div>
                      {ETICHETTE_PRIVILEGI[priv]}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
