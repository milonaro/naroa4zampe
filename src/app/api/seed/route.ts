// API per il seeding dei dati dimostrativi
// POST: genera dati di esempio per il testing
// I dati usano le coordinate e il nome del comune configurato nel DB

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getComuneConfig } from '@/lib/tenant';

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
    tipoAnimale: 'cane',
    motivazione: 'randagismo',
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
    tipoAnimale: 'cane',
    motivazione: 'abbandono',
    urgenza: 'critica',
    stato: 'in_lavorazione',
    nomeSegnalatore: 'Laura',
    cognomeSegnalatore: 'Bianchi',
    emailSegnalatore: 'laura.bianchi@email.it',
    telefonoSegnalatore: '3349876543',
  },
  {
    titolo: 'Gatto randagio al parco comunale',
    descrizione: 'Un gatto soriano girovaga nel parco comunale da diverse settimane. Sembra affamato e ha bisogno di cure.',
    latitudine: 37.2984,
    longitudine: 13.7794,
    indirizzo: 'Parco Comunale, Naro',
    razza: 'Soriano',
    colore: 'Tigrato',
    taglia: 'media',
    tipoAnimale: 'gatto',
    motivazione: 'randagismo',
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
    tipoAnimale: 'cane',
    motivazione: 'rinvenimento',
    urgenza: 'critica',
    stato: 'in_lavorazione',
    nomeSegnalatore: 'Anna',
    cognomeSegnalatore: 'Ferrara',
    emailSegnalatore: 'anna.ferrara@email.it',
    telefonoSegnalatore: '3355551234',
  },
  {
    titolo: 'Gatto maltrattato nel quartiere San Calogero',
    descrizione: 'Un gatto con evidenti segni di maltrattamento è stato trovato nel quartiere San Calogero. Presenta ferite e è molto spaventato.',
    latitudine: 37.2944,
    longitudine: 13.7784,
    indirizzo: 'Quartiere San Calogero, Naro',
    razza: 'Europeo',
    colore: 'Nero',
    taglia: 'piccola',
    tipoAnimale: 'gatto',
    motivazione: 'maltrattamento',
    urgenza: 'critica',
    stato: 'ricevuta',
    nomeSegnalatore: 'Carmela',
    cognomeSegnalatore: 'Gallo',
    emailSegnalatore: 'carmela.gallo@email.it',
    telefonoSegnalatore: '3371112233',
  },
  {
    titolo: 'Cane smarrito con collare rosso',
    descrizione: 'Un cane con un collare rosso girovaga vicino alla Chiesa Madre. Probabilmente smarrito dal proprietario. Sembra ben curato.',
    latitudine: 37.2969,
    longitudine: 13.7769,
    indirizzo: 'Piazza Chiesa Madre, Naro',
    razza: 'Labrador',
    colore: 'Dorato',
    taglia: 'grande',
    tipoAnimale: 'cane',
    motivazione: 'smarrimento',
    urgenza: 'media',
    stato: 'risolta',
    nomeSegnalatore: 'Maria',
    cognomeSegnalatore: 'Costa',
    emailSegnalatore: 'maria.costa@email.it',
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
    tipoAnimale: 'cane',
    motivazione: 'abbandono',
    urgenza: 'critica',
    stato: 'ricevuta',
    nomeSegnalatore: 'Pietro',
    cognomeSegnalatore: 'Barbieri',
    emailSegnalatore: 'pietro.barbieri@email.it',
    telefonoSegnalatore: '3405556677',
  },
  {
    titolo: 'Gatto rinvenuto presso il cimitero',
    descrizione: 'Un gatto è stato trovato nei pressi del cimitero vecchio. Sembra affamato ma amichevole, probabilmente abbandonato.',
    latitudine: 37.2994,
    longitudine: 13.7714,
    indirizzo: 'Via Cimitero, Naro',
    razza: 'Soriano',
    colore: 'Arancione',
    taglia: 'media',
    tipoAnimale: 'gatto',
    motivazione: 'rinvenimento',
    urgenza: 'alta',
    stato: 'ricevuta',
    nomeSegnalatore: 'Salvatore',
    cognomeSegnalatore: 'Lombardo',
    emailSegnalatore: 'salvatore.lombardo@email.it',
    telefonoSegnalatore: '3371112233',
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
    tipoAnimale: 'cane',
    motivazione: 'randagismo',
    urgenza: 'critica',
    stato: 'ricevuta',
    nomeSegnalatore: 'Antonella',
    cognomeSegnalatore: 'Marino',
    emailSegnalatore: 'antonella.marino@email.it',
    telefonoSegnalatore: '3389998877',
  },
  {
    titolo: 'Cane denutrito alla fermata dei bus',
    descrizione: 'Un cane molto magro è stato visto vicino alla fermata dei bus. Sembra denutrito e ha bisogno di cure veterinarie.',
    latitudine: 37.2950,
    longitudine: 13.7740,
    indirizzo: 'Via Stazione, Naro',
    razza: 'Meticcio',
    colore: 'Bianco',
    taglia: 'media',
    tipoAnimale: 'cane',
    motivazione: 'abbandono',
    urgenza: 'alta',
    stato: 'in_lavorazione',
    nomeSegnalatore: 'Roberto',
    cognomeSegnalatore: 'Conti',
    emailSegnalatore: 'roberto.conti@email.it',
  },
  {
    titolo: 'Gatto smarrito nel centro storico',
    descrizione: 'Un gatto con collare azzurro è stato avvistato più volte nel centro storico. Sembra ben curato, probabilmente perso.',
    latitudine: 37.2968,
    longitudine: 13.7760,
    indirizzo: 'Corso Vittorio Emanuele, Naro',
    razza: 'Persiano',
    colore: 'Bianco',
    taglia: 'media',
    tipoAnimale: 'gatto',
    motivazione: 'smarrimento',
    urgenza: 'bassa',
    stato: 'risolta',
    nomeSegnalatore: 'Francesca',
    cognomeSegnalatore: 'Ricci',
    emailSegnalatore: 'francesca.ricci@email.it',
  },
  {
    titolo: 'Cane maltrattato in zona periferica',
    descrizione: 'Un cane presenta evidenti segni di maltrattamento nella zona periferica. Ha catene incastonate nel collo e ferite.',
    latitudine: 37.2900,
    longitudine: 13.7700,
    indirizzo: 'Via Periferia, Naro',
    razza: 'Meticcio',
    colore: 'Nero',
    taglia: 'grande',
    tipoAnimale: 'cane',
    motivazione: 'maltrattamento',
    urgenza: 'critica',
    stato: 'ricevuta',
    nomeSegnalatore: 'Alessandro',
    cognomeSegnalatore: 'Leone',
    emailSegnalatore: 'alessandro.leone@email.it',
    telefonoSegnalatore: '3427778899',
  },
  {
    titolo: 'Coniglio rinvenuto nei pressi del parco',
    descrizione: 'Un coniglio domestico è stato trovato libero nel parco comunale. Probabilmente abbandonato dai proprietari.',
    latitudine: 37.2980,
    longitudine: 13.7720,
    indirizzo: 'Parco Comunale, Naro',
    razza: 'Nano',
    colore: 'Bianco e marrone',
    taglia: 'piccola',
    tipoAnimale: 'altro',
    motivazione: 'rinvenimento',
    urgenza: 'media',
    stato: 'in_lavorazione',
    nomeSegnalatore: 'Elena',
    cognomeSegnalatore: 'Moretti',
    emailSegnalatore: 'elena.moretti@email.it',
  },
  {
    titolo: 'Cane randagio area sportiva',
    descrizione: 'Un cane di piccola taglia è stato visto più volte vicino all\'area sportiva comunale. I bambini sono spaventati.',
    latitudine: 37.2940,
    longitudine: 13.7770,
    indirizzo: 'Area Sportiva, Naro',
    razza: 'Volpino',
    colore: 'Bianco',
    taglia: 'piccola',
    tipoAnimale: 'cane',
    motivazione: 'randagismo',
    urgenza: 'media',
    stato: 'archiviata',
    nomeSegnalatore: 'Daniele',
    cognomeSegnalatore: 'Greco',
    emailSegnalatore: 'daniele.greco@email.it',
  },
  {
    titolo: 'Gatto abbandonato nel cassonetto',
    descrizione: 'Un gatto è stato trovato dentro un cassonetto della spazzatura. Fortunatamente ancora vivo ma molto spaventato e sporco.',
    latitudine: 37.2935,
    longitudine: 13.7765,
    indirizzo: 'Via Roma, Naro',
    razza: 'Europeo',
    colore: 'Grigio',
    taglia: 'media',
    tipoAnimale: 'gatto',
    motivazione: 'abbandono',
    urgenza: 'critica',
    stato: 'in_lavorazione',
    nomeSegnalatore: 'Vincenzo',
    cognomeSegnalatore: 'Russo',
    emailSegnalatore: 'vincenzo.russo@email.it',
    telefonoSegnalatore: '3391234567',
  },
  {
    titolo: 'Cane smarrito con microchip',
    descrizione: 'Un cane con microchip rilevato è stato trovato nelle vicinanze della farmacia. Sembra aver perso il padrone.',
    latitudine: 37.2970,
    longitudine: 13.7755,
    indirizzo: 'Via Farmacia, Naro',
    razza: 'Beagle',
    colore: 'Tricolore',
    taglia: 'media',
    tipoAnimale: 'cane',
    motivazione: 'smarrimento',
    urgenza: 'alta',
    stato: 'ricevuta',
    nomeSegnalatore: 'Teresa',
    cognomeSegnalatore: 'Amato',
    emailSegnalatore: 'teresa.amato@email.it',
    telefonoSegnalatore: '3415556677',
  },
  {
    titolo: 'Colonia di gatti vicino alla chiesa',
    descrizione: 'Una colonia di circa 8 gatti vive vicino alla Chiesa di San Calogero. Alcuni sembrano malati e hanno bisogno di cure veterinarie.',
    latitudine: 37.2965,
    longitudine: 13.7775,
    indirizzo: 'Chiesa San Calogero, Naro',
    razza: 'Soriano/Europeo',
    colore: 'Vari',
    taglia: 'media',
    tipoAnimale: 'gatto',
    motivazione: 'randagismo',
    urgenza: 'media',
    stato: 'ricevuta',
    nomeSegnalatore: 'Rosa',
    cognomeSegnalatore: 'Pappalardo',
    emailSegnalatore: 'rosa.pappalardo@email.it',
    telefonoSegnalatore: '3467891234',
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

    // Carica config del comune per usare coordinate e nome corretti
    const config = await getComuneConfig(db);
    const nomeCitta = config.nomeComune.replace('Comune di ', '');
    const baseLat = config.latCentro;
    const baseLng = config.lngCentro;

    // Template dati dimostrativi — coordinate e indirizzi sono relativi al centro del comune
    const templateSeed = [
      { offsetLat: 0.0010, offsetLng: 0.0010, indirizzo: `Piazza Centrale, ${nomeCitta}`, titolo: 'Cane randagio vicino alla piazza centrale', descrizione: 'Un cane di media taglia girovaga vicino alla piazza centrale da qualche giorno. Sembra docile ma ha bisogno di assistenza.', razza: 'Meticcio', colore: 'Marrone', taglia: 'media', tipoAnimale: 'cane', motivazione: 'randagismo', urgenza: 'media', stato: 'ricevuta' },
      { offsetLat: -0.0010, offsetLng: -0.0010, indirizzo: `Via della Scuola, ${nomeCitta}`, titolo: 'Cucciolo abbandonato vicino alla scuola', descrizione: 'Un cucciolo di piccola taglia è stato trovato vicino alla scuola elementare. È molto spaventato e ha bisogno di cure immediate.', razza: 'Meticcio', colore: 'Bianco e nero', taglia: 'piccola', tipoAnimale: 'cane', motivazione: 'abbandono', urgenza: 'critica', stato: 'in_lavorazione' },
      { offsetLat: 0.0020, offsetLng: 0.0030, indirizzo: `Parco Comunale, ${nomeCitta}`, titolo: 'Gatto randagio al parco comunale', descrizione: 'Un gatto soriano girovaga nel parco comunale da diverse settimane. Sembra affamato e ha bisogno di cure.', razza: 'Soriano', colore: 'Tigrato', taglia: 'media', tipoAnimale: 'gatto', motivazione: 'randagismo', urgenza: 'bassa', stato: 'ricevuta' },
      { offsetLat: -0.0030, offsetLng: -0.0030, indirizzo: `Strada Provinciale, ${nomeCitta}`, titolo: 'Cane ferito lungo la strada provinciale', descrizione: 'Un cane sembra ferito a una zampa lungo la strada provinciale. Non si avvicina alle persone ma zoppica visibilmente.', razza: 'Meticcio', colore: 'Grigio', taglia: 'media', tipoAnimale: 'cane', motivazione: 'rinvenimento', urgenza: 'critica', stato: 'in_lavorazione' },
      { offsetLat: -0.0020, offsetLng: 0.0020, indirizzo: `Centro Storico, ${nomeCitta}`, titolo: 'Gatto maltrattato nel centro storico', descrizione: 'Un gatto con evidenti segni di maltrattamento è stato trovato nel centro storico. Presenta ferite e è molto spaventato.', razza: 'Europeo', colore: 'Nero', taglia: 'piccola', tipoAnimale: 'gatto', motivazione: 'maltrattamento', urgenza: 'critica', stato: 'ricevuta' },
      { offsetLat: 0.0005, offsetLng: 0.0005, indirizzo: `Piazza Chiesa, ${nomeCitta}`, titolo: 'Cane smarrito con collare rosso', descrizione: 'Un cane con un collare rosso girovaga vicino alla chiesa. Probabilmente smarrito dal proprietario. Sembra ben curato.', razza: 'Labrador', colore: 'Dorato', taglia: 'grande', tipoAnimale: 'cane', motivazione: 'smarrimento', urgenza: 'media', stato: 'risolta' },
      { offsetLat: -0.0044, offsetLng: 0.0036, indirizzo: `Contrada Periferia, ${nomeCitta}`, titolo: 'Cucciolata abbandonata in campagna', descrizione: 'Una cucciolata di 4 cuccioli è stata trovata in una scatola lungo la strada di campagna. Hanno circa 3 settimane.', razza: 'Meticcio', colore: 'Vari', taglia: 'piccola', tipoAnimale: 'cane', motivazione: 'abbandono', urgenza: 'critica', stato: 'ricevuta' },
      { offsetLat: 0.0030, offsetLng: -0.0050, indirizzo: `Via Cimitero, ${nomeCitta}`, titolo: 'Gatto rinvenuto presso il cimitero', descrizione: 'Un gatto è stato trovato nei pressi del cimitero vecchio. Sembra affamato ma amichevole, probabilmente abbandonato.', razza: 'Soriano', colore: 'Arancione', taglia: 'media', tipoAnimale: 'gatto', motivazione: 'rinvenimento', urgenza: 'alta', stato: 'ricevuta' },
      { offsetLat: -0.0004, offsetLng: -0.0014, indirizzo: `Via del Mercato, ${nomeCitta}`, titolo: 'Cane aggressivo vicino al mercato', descrizione: 'Un cane di grande taglia mostra comportamento aggressivo vicino all\'area del mercato. Pericolo per i passanti.', razza: 'Rottweiler mix', colore: 'Nero e marrone', taglia: 'grande', tipoAnimale: 'cane', motivazione: 'randagismo', urgenza: 'critica', stato: 'ricevuta' },
      { offsetLat: -0.0014, offsetLng: -0.0024, indirizzo: `Via Stazione, ${nomeCitta}`, titolo: 'Cane denutrito alla fermata dei bus', descrizione: 'Un cane molto magro è stato visto vicino alla fermata dei bus. Sembra denutrito e ha bisogno di cure veterinarie.', razza: 'Meticcio', colore: 'Bianco', taglia: 'media', tipoAnimale: 'cane', motivazione: 'abbandono', urgenza: 'alta', stato: 'in_lavorazione' },
      { offsetLat: 0.0004, offsetLng: -0.0004, indirizzo: `Corso Principale, ${nomeCitta}`, titolo: 'Gatto smarrito nel centro storico', descrizione: 'Un gatto con collare azzurro è stato avvistato più volte nel centro storico. Sembra ben curato, probabilmente perso.', razza: 'Persiano', colore: 'Bianco', taglia: 'media', tipoAnimale: 'gatto', motivazione: 'smarrimento', urgenza: 'bassa', stato: 'risolta' },
      { offsetLat: -0.0064, offsetLng: -0.0064, indirizzo: `Zona Periferica, ${nomeCitta}`, titolo: 'Cane maltrattato in zona periferica', descrizione: 'Un cane presenta evidenti segni di maltrattamento nella zona periferica. Ha catene incastonate nel collo e ferite.', razza: 'Meticcio', colore: 'Nero', taglia: 'grande', tipoAnimale: 'cane', motivazione: 'maltrattamento', urgenza: 'critica', stato: 'ricevuta' },
      { offsetLat: 0.0016, offsetLng: -0.0044, indirizzo: `Parco Comunale, ${nomeCitta}`, titolo: 'Coniglio rinvenuto nei pressi del parco', descrizione: 'Un coniglio domestico è stato trovato libero nel parco comunale. Probabilmente abbandonato dai proprietari.', razza: 'Nano', colore: 'Bianco e marrone', taglia: 'piccola', tipoAnimale: 'altro', motivazione: 'rinvenimento', urgenza: 'media', stato: 'in_lavorazione' },
      { offsetLat: -0.0024, offsetLng: 0.0006, indirizzo: `Area Sportiva, ${nomeCitta}`, titolo: 'Cane randagio area sportiva', descrizione: 'Un cane di piccola taglia è stato visto più volte vicino all\'area sportiva comunale. I bambini sono spaventati.', razza: 'Volpino', colore: 'Bianco', taglia: 'piccola', tipoAnimale: 'cane', motivazione: 'randagismo', urgenza: 'media', stato: 'archiviata' },
      { offsetLat: -0.0029, offsetLng: 0.0001, indirizzo: `Via Roma, ${nomeCitta}`, titolo: 'Gatto abbandonato nel cassonetto', descrizione: 'Un gatto è stato trovato dentro un cassonetto della spazzatura. Fortunatamente ancora vivo ma molto spaventato e sporco.', razza: 'Europeo', colore: 'Grigio', taglia: 'media', tipoAnimale: 'gatto', motivazione: 'abbandono', urgenza: 'critica', stato: 'in_lavorazione' },
      { offsetLat: 0.0006, offsetLng: -0.0009, indirizzo: `Via Farmacia, ${nomeCitta}`, titolo: 'Cane smarrito con microchip', descrizione: 'Un cane con microchip rilevato è stato trovato nelle vicinanze della farmacia. Sembra aver perso il padrone.', razza: 'Beagle', colore: 'Tricolore', taglia: 'media', tipoAnimale: 'cane', motivazione: 'smarrimento', urgenza: 'alta', stato: 'ricevuta' },
      { offsetLat: 0.0001, offsetLng: 0.0011, indirizzo: `Chiesa Centrale, ${nomeCitta}`, titolo: 'Colonia di gatti vicino alla chiesa', descrizione: 'Una colonia di circa 8 gatti vive vicino alla chiesa centrale. Alcuni sembrano malati e hanno bisogno di cure veterinarie.', razza: 'Soriano/Europeo', colore: 'Vari', taglia: 'media', tipoAnimale: 'gatto', motivazione: 'randagismo', urgenza: 'media', stato: 'ricevuta' },
    ];

    const nomiSegnalatori = [
      { nome: 'Marco', cognome: 'Rossi', email: 'marco.rossi@email.it', telefono: '3331234567' },
      { nome: 'Laura', cognome: 'Bianchi', email: 'laura.bianchi@email.it', telefono: '3349876543' },
      { nome: 'Giuseppe', cognome: 'Verdi', email: 'giuseppe.verdi@email.it', telefono: null },
      { nome: 'Anna', cognome: 'Ferrara', email: 'anna.ferrara@email.it', telefono: '3355551234' },
      { nome: 'Carmela', cognome: 'Gallo', email: 'carmela.gallo@email.it', telefono: '3371112233' },
      { nome: 'Maria', cognome: 'Costa', email: 'maria.costa@email.it', telefono: null },
      { nome: 'Pietro', cognome: 'Barbieri', email: 'pietro.barbieri@email.it', telefono: '3405556677' },
      { nome: 'Salvatore', cognome: 'Lombardo', email: 'salvatore.lombardo@email.it', telefono: '3371112233' },
      { nome: 'Antonella', cognome: 'Marino', email: 'antonella.marino@email.it', telefono: '3389998877' },
      { nome: 'Roberto', cognome: 'Conti', email: 'roberto.conti@email.it', telefono: null },
      { nome: 'Francesca', cognome: 'Ricci', email: 'francesca.ricci@email.it', telefono: null },
      { nome: 'Alessandro', cognome: 'Leone', email: 'alessandro.leone@email.it', telefono: '3427778899' },
      { nome: 'Elena', cognome: 'Moretti', email: 'elena.moretti@email.it', telefono: null },
      { nome: 'Daniele', cognome: 'Greco', email: 'daniele.greco@email.it', telefono: null },
      { nome: 'Vincenzo', cognome: 'Russo', email: 'vincenzo.russo@email.it', telefono: '3391234567' },
      { nome: 'Teresa', cognome: 'Amato', email: 'teresa.amato@email.it', telefono: '3415556677' },
      { nome: 'Rosa', cognome: 'Pappalardo', email: 'rosa.pappalardo@email.it', telefono: '3467891234' },
    ];

    // Creazione segnalazioni con coordinate relative al centro del comune
    const segnalazioniCreate = [];
    for (let i = 0; i < templateSeed.length; i++) {
      const t = templateSeed[i];
      const segnalatore = nomiSegnalatori[i] || nomiSegnalatori[0];

      // Varia la data di creazione per avere dati più realistici
      const dataCreazione = new Date();
      const giorniFa = Math.floor(Math.random() * 90);
      dataCreazione.setDate(dataCreazione.getDate() - giorniFa);

      const segnalazione = await db.segnalazione.create({
        data: {
          titolo: t.titolo,
          descrizione: t.descrizione,
          latitudine: baseLat + t.offsetLat,
          longitudine: baseLng + t.offsetLng,
          indirizzo: t.indirizzo,
          razza: t.razza,
          colore: t.colore,
          taglia: t.taglia,
          tipoAnimale: t.tipoAnimale as 'cane' | 'gatto' | 'altro',
          motivazione: t.motivazione as 'randagismo' | 'abbandono' | 'maltrattamento' | 'smarrimento' | 'rinvenimento' | 'altro',
          urgenza: t.urgenza as 'bassa' | 'media' | 'alta' | 'critica',
          stato: t.stato as 'ricevuta' | 'in_lavorazione' | 'risolta' | 'archiviata',
          nomeSegnalatore: segnalatore.nome,
          cognomeSegnalatore: segnalatore.cognome,
          emailSegnalatore: segnalatore.email,
          telefonoSegnalatore: segnalatore.telefono,
          consensoPrivacy: true,
          consensoDichiarazione: true,
          dataConsenso: dataCreazione,
          createdAt: dataCreazione,
        },
      });

      // Crea notifica associata
      const tipoNotifica = t.urgenza === 'critica' || t.urgenza === 'alta'
        ? 'urgenza_alta'
        : 'nuova_segnalazione';

      await db.notifica.create({
        data: {
          messaggio: tipoNotifica === 'urgenza_alta'
            ? `⚠️ Segnalazione urgente: ${t.titolo}`
            : `Nuova segnalazione: ${t.titolo}`,
          tipo: tipoNotifica,
          segnalazioneId: segnalazione.id,
          letta: Math.random() > 0.5,
        },
      });

      segnalazioniCreate.push(segnalazione);
    }

    return NextResponse.json({
      messaggio: 'Dati dimostrativi creati con successo',
      segnalazioniCreate: segnalazioniCreate.length,
      comune: config.nomeComune,
    });
  } catch (errore) {
    console.error('Errore nel seeding dei dati:', errore);
    return NextResponse.json(
      { errore: 'Errore nel seeding dei dati dimostrativi' },
      { status: 500 }
    );
  }
}
