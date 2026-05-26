// Script di migrazione: hashizza le password in chiaro nel campo credenziali del Comune
// Eseguire UNA SOLA VOLTA con: bun scripts/migrate-passwords.ts
//
// Questo script:
// 1. Legge tutti i record Comune esistenti
// 2. Per ogni credenziale non ancora hashata (non inizia con $2b$), la hashizza
// 3. Salva il record aggiornato
//
// È sicuro eseguire questo script più volte: le password già hashate vengono saltate.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;
const prisma = new PrismaClient();

interface Credenziale {
  username: string;
  password: string;
  nome: string;
  ruolo: string;
}

function isHashed(value: string): boolean {
  return value.startsWith('$2a$') || value.startsWith('$2b$');
}

async function migrate() {
  console.log('🔧 Inizio migrazione password...');
  console.log('');

  const comuni = await prisma.comune.findMany();
  console.log(`📋 Trovati ${comuni.length} record Comune`);

  let totalHashed = 0;

  for (const comune of comuni) {
    let credenziali: Credenziale[];
    try {
      credenziali = JSON.parse(comune.credenziali);
      if (!Array.isArray(credenziali) || credenziali.length === 0) {
        console.log(`  ⏭️  Comune "${comune.nomeComune}": nessuna credenziale, skip`);
        continue;
      }
    } catch {
      console.log(`  ⚠️  Comune "${comune.nomeComune}": formato credenziali non valido, skip`);
      continue;
    }

    let modified = false;
    const credenzialiAggiornate = await Promise.all(
      credenziali.map(async (cred) => {
        if (isHashed(cred.password)) {
          console.log(`  ✅ Comune "${comune.nomeComune}": utente "${cred.username}" già hashato, skip`);
          return cred;
        }

        const hashedPassword = await bcrypt.hash(cred.password, SALT_ROUNDS);
        console.log(`  🔒 Comune "${comune.nomeComune}": utente "${cred.username}" hashato`);
        modified = true;
        totalHashed++;
        return { ...cred, password: hashedPassword };
      })
    );

    if (modified) {
      await prisma.comune.update({
        where: { id: comune.id },
        data: { credenziali: JSON.stringify(credenzialiAggiornate) },
      });
      console.log(`  💾 Comune "${comune.nomeComune}": credenziali salvate`);
    }
  }

  console.log('');
  console.log(`✅ Migrazione completata: ${totalHashed} password hashate`);

  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error('❌ Errore durante la migrazione:', err);
  prisma.$disconnect();
  process.exit(1);
});
