'use client';

import { ArrowLeft, Dog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PolicyLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function PolicyLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: PolicyLayoutProps) {
  const router = useRouter();

  return (
    <>
      {/* Header Navigation - Standardizzato */}
      <header className="sticky top-0 z-40 w-full border-b border-amber-100 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-md">
              <Dog className="h-6 w-6" />
            </div>
            <span className="text-base font-semibold text-yellow-800 hidden sm:inline">
              a 4 Zampe
            </span>
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Indietro
          </Button>
        </div>
      </header>

      {/* Main Content - Standardizzato */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose max-w-none">
          {/* Titolo principale */}
          <h1 className="text-4xl font-bold text-yellow-900 mb-2">
            {title}
          </h1>

          {/* Sottotitolo */}
          <p className="text-lg text-amber-700 mb-8">
            {subtitle}
          </p>

          {/* Data ultimo aggiornamento */}
          {lastUpdated && (
            <div className="bg-yellow-50/50 border-2 border-yellow-100 rounded-lg p-5 mb-8">
              <p className="text-sm text-amber-800/75 font-medium">
                <strong>Ultimo aggiornamento:</strong> {lastUpdated}
              </p>
            </div>
          )}

          {/* Contenuto */}
          {children}

          {/* Footer sezione */}
          <section className="mt-12 pt-6 border-t-2 border-yellow-100">
            <p className="text-sm text-amber-700/75">
              Le presenti informazioni sono redatte in conformità alle normative vigenti
              e ai regolamenti dell&apos;Unione Europea.
            </p>
          </section>
        </article>
      </div>
    </>
  );
}
