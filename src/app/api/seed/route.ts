// API per il seeding dei dati dimostrativi
// POST: genera dati di esempio per il testing

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Dati di esempio per le segnalazioni
const datiDimostrativi = [
  {
    titolo: 'Cane randagio vicino alla piazza centrale',
    descrizione: 'Un cane di media taglia girovaga vicino alla Piazza Garibaldi da qualche giorno. Sembra docile ma ha bisogno di assistenza.',
    latitudine: 37.2974,
    longitudine: 13.7774,
    indirizzo: 'Piazza Garibaldi, Naro',
    razza: 'Meticcio',
    colore: 'Marrone',
    taglia: 'media',
    urgenza: 'media',
    stato: 'ricevuta',
    nomeSegnalatore: 'Marco',
    cognomeSegnalatore: 'Rossi',
    emailSegnalatore: 'marco.rossi@email.it',
    telefonoSegnalatore: '3331234567',
  },
  {
    titolo: 'Cucciolo abbandonato vicino alla scuola',
    descrizione: 'Un cucciolo di piccola taglia è stato trovato vicino alla scuola elementare. È molto spaventato e ha bisogno di cure immediate.',
    latitudine: 37.2954,
    longitudine: 13.7754,
    indirizzo: 'Via della Scuola, Naro',
    razza: 'Meticcio',
    colore: 'Bianco e nero',
    taglia: 'piccola',
    urgenza: 'critica',
    stato: 'in_lavorazione',
    nomeSegnalatore: 'Laura',
    cognomeSegnalatore: 'Bianchi',
    emailSegnalatore: 'laura.bianchi@email.it',
    telefonoSegnalatore: '3349876543',
  },
  {
    titolo: 'Cane grande senza collare al parco',
    descrizione: 'Un cane di grande taglia senza collare è stato avvistato nel parco comunale. Sembra in buone condizioni di salute.',
    latitudine: 37.2984,
    longitudine: 13.7794,
    indirizzo: 'Parco Comunale, Naro',
    razza: 'Pastore Tedesco',
    colore: 'Nero e marrone',
    taglia: 'grande',
    urgenza: 'bassa',
    stato: 'ricevuta',
    nomeSegnalatore: 'Giuseppe',
    cognomeSegnalatore: 'Verdi',
    emailSegnalatore: 'giuseppe.verdi@email.it',
  },
  {
    titolo: 'Cane ferito lungo la strada provinciale',
    descrizione: 'Un cane sembra ferito a una zampa lungo la strada provinciale. Non si avvicina alle persone ma zoppica visibilmente.',
    latitudine: 37.2934,
    longitudine: 13.7734,
    indirizzo: 'Strada Provinciale 38, Naro',
    razza: 'Meticcio',
    colore: 'Grigio',
    taglia: 'media',
    urgenza: 'critica',
    stato: 'in_lavorazione',
    nomeSegnalatore: 'Anna',
    cognomeSegnalatore: 'Ferrara',
    emailSegnalatore: 'anna.ferrara@email.it',
    telefonoSegnalatore: '3355551234',
  },
  {
    titolo: 'Cagnolino vicino al cimitero',
    descrizione: 'Un piccolo cane è stato visto diverse volte nei pressi del cimitero. Sembra affamato ma amichevole.',
    latitudine: 37.2994,
    longitudine: 13.7714,
    indirizzo: 'Via Cimitero, Naro',
    razza: 'Chihuahua mix',
    colore: 'Beige',
    taglia: 'piccola',
    urgenza: 'alta',
    stato: 'ricevuta',
    nomeSegnalatore: 'Carmela',
    cognomeSegnalatore: 'Gallo',
    emailSegnalatore: 'carmela.gallo@email.it',
  },
  {
    titolo: 'Due cani randagi al quartiere San Calogero',
    descrizione: 'Due cani randagi girano per il quartiere San Calogero da circa una settimana. I residenti sono preoccupati.',
    latitudine: 37.2944,
    longitudine: 13.7784,
    indirizzo: 'Quartiere San Calogero, Naro',
    razza: 'Meticcio',
    colore: 'Nero',
    taglia: 'media',
    urgenza: 'alta',
    stato: 'ricevuta',
    nomeSegnalatore: 'Salvatore',
    cognomeSegnalatore: 'Lombardo',
    emailSegnalatore: 'salvatore.lombardo@email.it',
    telefonoSegnalatore: '3371112233',
  },
  {
    titolo: 'Cane con collare rosso vicino alla chiesa',
    descrizione: 'Un cane con un collare rosso girovaga vicino alla Chiesa Madre. Probabilmente smarrito dal proprietario.',
    latitudine: 37.2969,
    longitudine: 13.7769,
    indirizzo: 'Piazza Chiesa Madre, Naro',
    razza: 'Labrador',
    colore: 'Dorato',
    taglia: 'grande',
    urgenza: 'media',
    stato: 'risolta',
    nomeSegnalatore: 'Maria',
    cognomeSegnalatore: 'Costa',
    emailSegnalatore: 'maria.costa@email.it',
  },
  {
    titolo: 'Cane randagio nella zona agricola',
    descrizione: 'Un cane è stato avvistato ripetutamente nella zona agricola a est di Naro. Sembra in cerca di cibo.',
    latitudine: 37.2914,
    longitudine: 13.7814,
    indirizzo: 'Contrada Calogero, Naro',
    razza: 'Meticcio',
    colore: 'Marrone e bianco',
    taglia: 'media',
    urgenza: 'bassa',
    stato: 'archiviata',
    nomeSegnalatore: 'Vincenzo',
    cognomeSegnalatore: 'Russo',
    emailSegnalatore: 'vincenzo.russo@email.it',
  },
  {
    titolo: 'Cane aggressivo vicino al mercato',
    descrizione: 'Un cane di grande taglia mostra comportamento aggressivo vicino all\'area del mercato. Pericolo per i passanti.',
    latitudine: 37.2960,
    longitudine: 13.7750,
    indirizzo: 'Via del Mercato, Naro',
    razza: 'Rottweiler mix',
    colore: 'Nero e marrone',
    taglia: 'grande',
    urgenza: 'critica',
    stato: 'ricevuta',
    nomeSegnalatore: 'Antonella',
    cognomeSegnalatore: 'Marino',
    emailSegnalatore: 'antonella.marino@email.it',
    telefonoSegnalatore: '3389998877',
  },
  {
    titolo: 'Cane magro vicino alla stazione dei bus',
    descrizione: 'Un cane molto magro è stato visto vicino alla fermata dei bus. Sembra denutrito e ha bisogno di cure veterinarie.',
    latitudine: 37.2950,
    longitudine: 13.7740,
    indirizzo: 'Via Stazione, Naro',
    razza: 'Meticcio',
    colore: 'Bianco',
    taglia: 'media',
    urgenza: 'alta',
    stato: 'in_lavorazione',
    nomeSegnalatore: 'Roberto',
    cognomeSegnalatore: 'Conti',
    emailSegnalatore: 'roberto.conti@email.it',
  },
  {
    titolo: 'Cane randagio nella via principale',
    descrizione: 'Un cane è stato avvistato più volte nella via principale del centro storico. Sembra ben curato, probabilmente smarrito.',
    latitudine: 37.2968,
    longitudine: 13.7760,
    indirizzo: 'Corso Vittorio Emanuele, Naro',
    razza: 'Beagle',
    colore: 'Tricolore',
    taglia: 'media',
    urgenza: 'bassa',
    stato: 'risolta',
    nomeSegnalatore: 'Francesca',
    cognomeSegnalatore: 'Ricci',
    emailSegnalatore: 'francesca.ricci@email.it',
  },
  {
    titolo: 'Cucciolata abbandonata in campagna',
    descrizione: 'Una cucciolata di 4 cuccioli è stata trovata in una scatola lungo la strada di campagna. Hanno circa 3 settimane.',
    latitudine: 37.2920,
    longitudine: 13.7800,
    indirizzo: 'Contrada San Francesco, Naro',
    razza: 'Meticcio',
    colore: 'Vari',
    taglia: 'piccola',
    urgenza: 'critica',
    stato: 'ricevuta',
    nomeSegnalatore: 'Pietro',
    cognomeSegnalatore: 'Barbieri',
    emailSegnalatore: 'pietro.barbieri@email.it',
    telefonoSegnalatore: '3405556677',
  },
  {
    titolo: 'Cane randagio al camposanto vecchio',
    descrizione: 'Un cane anziano girovaga vicino al camposanto vecchio. Sembra avere difficoltà a camminare.',
    latitudine: 37.2980,
    longitudine: 13.7720,
    indirizzo: 'Via Camposanto, Naro',
    razza: 'Meticcio',
    colore: 'Grigio e bianco',
    taglia: 'media',
    urgenza: 'media',
    stato: 'in_lavorazione',
    nomeSegnalatore: 'Elena',
    cognomeSegnalatore: 'Moretti',
    emailSegnalatore: 'elena.moretti@email.it',
  },
  {
    titolo: 'Cane vicino all\'area sportiva',
    descrizione: 'Un cane di piccola taglia è stato visto più volte vicino all\'area sportiva comunale. I bambini sono spaventati.',
    latitudine: 37.2940,
    longitudine: 13.7770,
    indirizzo: 'Area Sportiva, Naro',
    razza: 'Volpino',
    colore: 'Bianco',
    taglia: 'piccola',
    urgenza: 'media',
    stato: 'archiviata',
    nomeSegnalatore: 'Daniele',
    cognomeSegnalatore: 'Greco',
    emailSegnalatore: 'daniele.greco@email.it',
  },
  {
    titolo: 'Cane idrofobo sospetto nel quartiere periferico',
    descrizione: 'Un cane mostra segni di malessere e comportamento anomalo nel quartiere periferico. Potrebbe essere idrofobo.',
    latitudine: 37.2900,
    longitudine: 13.7700,
    indirizzo: 'Via Periferia, Naro',
    razza: 'Meticcio',
    colore: 'Nero',
    taglia: 'grande',
    urgenza: 'critica',
    stato: 'ricevuta',
    nomeSegnalatore: 'Alessandro',
    cognomeSegnalatore: 'Leone',
    emailSegnalatore: 'alessandro.leone@email.it',
    telefonoSegnalatore: '3427778899',
  },
];

export async function POST() {
  try {
    // Verifica se esistono già dati
    const esistenti = await db.segnalazione.count();
    if (esistenti > 0) {
      return NextResponse.json(
        { messaggio: `Esistono già ${esistenti} segnalazioni. Eliminare i dati esistenti prima di eseguire il seed.` },
        { status: 400 }
      );
    }

    // Creazione segnalazioni con date variate
    const segnalazioniCreate = [];
    for (const dato of datiDimostrativi) {
      // Varia la data di creazione per avere dati più realistici
      const dataCreazione = new Date();
      const giorniFa = Math.floor(Math.random() * 90); // Ultimi 90 giorni
      dataCreazione.setDate(dataCreazione.getDate() - giorniFa);

      const segnalazione = await db.segnalazione.create({
        data: {
          ...dato,
          createdAt: dataCreazione,
        },
      });

      // Crea notifica associata
      const tipoNotifica = dato.urgenza === 'critica' || dato.urgenza === 'alta'
        ? 'urgenza_alta'
        : 'nuova_segnalazione';

      await db.notifica.create({
        data: {
          messaggio: tipoNotifica === 'urgenza_alta'
            ? `⚠️ Segnalazione urgente: ${dato.titolo}`
            : `Nuova segnalazione: ${dato.titolo}`,
          tipo: tipoNotifica,
          segnalazioneId: segnalazione.id,
          letta: Math.random() > 0.5, // Alcune lette, altre no
        },
      });

      segnalazioniCreate.push(segnalazione);
    }

    return NextResponse.json({
      messaggio: 'Dati dimostrativi creati con successo',
      segnalazioniCreate: segnalazioniCreate.length,
    });
  } catch (errore) {
    console.error('Errore nel seeding dei dati:', errore);
    return NextResponse.json(
      { errore: 'Errore nel seeding dei dati dimostrativi' },
      { status: 500 }
    );
  }
}
