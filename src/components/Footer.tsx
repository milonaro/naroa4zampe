// Componente Footer professionale
// Include link per Accesso Operatori e Dashboard
// Branding dinamico dal config del comune

'use client';

import { useStore } from '@/lib/store';
import { PawPrint, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const { adminAutenticato, impostaVista, configComune } = useStore();

  return (
    <footer className="border-t border-yellow-100/60 bg-white/80 backdrop-blur-sm py-4">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-yellow-400">
          <PawPrint className="h-4 w-4" />
          <span className="text-sm font-medium text-yellow-600">
            {configComune.nomeApp}
          </span>
          <span className="text-xs text-yellow-400 ml-2">
            &copy; {new Date().getFullYear()} {configComune.nomeComune}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!adminAutenticato && (
            <Button
              variant="ghost"
              size="sm"
              className="text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 gap-1.5 text-xs"
              onClick={() => impostaVista('dashboard')}
            >
              <Lock className="h-3.5 w-3.5" />
              Accesso Operatori
            </Button>
          )}
          {adminAutenticato && (
            <Button
              variant="ghost"
              size="sm"
              className="text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 gap-1.5 text-xs"
              onClick={() => impostaVista('dashboard')}
            >
              <Shield className="h-3.5 w-3.5" />
              Dashboard
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}
