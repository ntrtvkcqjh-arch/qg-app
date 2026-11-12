// Heure de Paris, quel que soit le fuseau du serveur (Vercel tourne en UTC)
// et quel que soit le changement d'heure.
const TZ = "Europe/Paris";

export function maintenantParis(d = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  const jours = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as const;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`, // AAAA-MM-JJ
    heure: Number(parts.hour),
    minute: Number(parts.minute),
    jourSemaine: jours[parts.weekday as keyof typeof jours], // 1 = lundi … 7 = dimanche
  };
}

export function dateLongueParis(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(`${iso}T12:00:00Z`));
}

/** Date AAAA-MM-JJ décalée de n jours. */
export function decalerJours(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
