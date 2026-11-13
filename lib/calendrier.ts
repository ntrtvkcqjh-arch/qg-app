// Calendrier simulé. Le jour 0 est le lundi 2 mars 2026 (en pleine saison
// des bilans). Seuls les jours ouvrés sont simulés, de 8h00 à minuit.

export const DEBUT_JOURNEE = 8 * 60; // 8h00
export const FIN_JOURNEE = 23 * 60 + 59; // minuit (les collaborateurs peuvent rester tard)
export const MINUTES_PAR_JOUR = FIN_JOURNEE - DEBUT_JOURNEE;

const ORIGINE = Date.UTC(2026, 2, 2); // lundi 2 mars 2026
const JOUR_MS = 86_400_000;

export const jourDe = (minute: number) => Math.floor(minute / 1440);
export const minuteDuJour = (minute: number) => minute % 1440;

export function dateDe(jour: number): Date {
  return new Date(ORIGINE + jour * JOUR_MS);
}

export function estOuvre(jour: number): boolean {
  const d = dateDe(jour).getUTCDay();
  return d !== 0 && d !== 6;
}

export function prochainJourOuvre(jour: number): number {
  let j = jour + 1;
  while (!estOuvre(j)) j++;
  return j;
}

/** Jour (index) correspondant à une date du calendrier 2026+. */
export function jourDeLaDate(annee: number, mois: number, jourMois: number): number {
  return Math.round((Date.UTC(annee, mois - 1, jourMois) - ORIGINE) / JOUR_MS);
}

/** Si la date tombe un week-end, l'échéance est reportée au lundi. */
export function ouvreOuApres(jour: number): number {
  let j = jour;
  while (!estOuvre(j)) j++;
  return j;
}

const fmtLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fmtCourt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

export const dateLongue = (jour: number) => fmtLong.format(dateDe(jour));
export const dateCourte = (jour: number) => fmtCourt.format(dateDe(jour));

export function heure(minute: number): string {
  const m = minuteDuJour(minute);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Nombre de jours ouvrés entre deux jours (exclu / inclus). */
export function joursOuvresEntre(de: number, a: number): number {
  let n = 0;
  for (let j = de + 1; j <= a; j++) if (estOuvre(j)) n++;
  return a < de ? -joursOuvresEntre(a, de) : n;
}

export const moisDe = (jour: number) => dateDe(jour).getUTCMonth() + 1;
export const anneeDe = (jour: number) => dateDe(jour).getUTCFullYear();
export const jourDuMois = (jour: number) => dateDe(jour).getUTCDate();
