// Componente Footer professionale
// Include link per Accesso Operatori e Dashboard

'use client';

import { useStore } from '@/lib/store';
import { PawPrint, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const { adminAutenticato, impostaVista } = useStore();

  return (
    <footer className="border-t border-amber-100/60 bg-white/80 backdrop-blur-sm py-4">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-400">
          <PawPrint className="h-4 w-4" />
          <span className="text-sm font-medium text-amber-600">
            Naro a 4 Zampe
          </span>
          <span className="text-xs text-amber-400 ml-2">
            &copy; {new Date().getFullYear()} Comune di Naro
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!adminAutenticato && (
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 gap-1.5 text-xs"
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
              className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 gap-1.5 text-xs"
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
