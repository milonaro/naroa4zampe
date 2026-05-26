// Utility geografiche condivise per l'applicazione multi-comune "a 4 Zampe"

/**
 * Calcola la distanza in km tra due punti geografici usando la formula di Haversine.
 * Usata per determinare se una segnalazione è dentro/fuori il raggio operativo.
 */
export function distanzaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raggio medio della Terra in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Verifica se un punto è dentro il raggio operativo dal centro del comune.
 */
export function eInZona(lat: number, lng: number, centroLat: number, centroLng: number, raggioKm: number): boolean {
  return distanzaKm(lat, lng, centroLat, centroLng) <= raggioKm;
}
