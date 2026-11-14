// Dossier complet « fil rouge » : un client suivi sur tout un exercice
// (saisie, TVA, paie, clôture, liasse, AG). Chaque réponse alimente les
// chiffres de l'étape suivante : une erreur en janvier fausse le résultat,
// l'impôt et l'affectation. Le bilan final compare tes comptes aux comptes justes.

import { jourDe } from "@/lib/calendrier";
import { messageSpecial } from "@/lib/ext";
import { clamp, log } from "@/lib/moteur";
import { souvenir } from "@/lib/vie2";
import type { Etat, OptionDilemme } from "@/lib/types";

const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const CLIENT = "Atelier Lumière SARL";

// Données de l'exercice (fixes).
const CA = 480_000;
const ACHATS = 300_000;
const AUTRES = 80_000;
const ORDI = 1_800;
const ASSURANCE = 1_200;
const COUT_SALARIE = 34_080; // 2 000 € brut × 12 × 1,42
const PLAFOND_RESERVE = 600; // réserve légale : 1 000 € (10 % du capital) − 400 € déjà dotés

const isPme = (r: number) => Math.max(0, Math.round(Math.min(r, 42_500) * 0.15 + Math.max(0, r - 42_500) * 0.25));

type FR = NonNullable<Etat["filRouge"]>;

/** Chiffres de l'exercice selon tes réponses (v = valeurs que tu as retenues). */
function chiffres(v: FR["v"]) {
  const immobilise = v.saisie !== false;
  const penalite = v.tvaOk === false ? 300 : 0;
  const salaires = v.salaires ?? COUT_SALARIE;
  const cca = v.cca ?? 900;
  const resultat = CA - ACHATS - AUTRES - salaires - (immobilise ? 600 : ORDI) - (ASSURANCE - cca) - penalite;
  const is = v.is ?? isPme(resultat);
  const net = resultat - is;
  return { immobilise, resultat, is, net, reserve: Math.min(Math.round(net * 0.05), PLAFOND_RESERVE) };
}

const JUSTE = chiffres({ saisie: true, tvaOk: true, salaires: COUT_SALARIE, cca: 900 });

type Etape = { titre: string; texte: (fr: FR) => string; options: (fr: FR) => { label: string; ok: boolean; maj: Partial<FR["v"]> }[] };

const ETAPES: Etape[] = [
  {
    titre: "Janvier — Saisie",
    texte: () => `Début d'exercice chez ${CLIENT} (fabrication de luminaires, capital 10 000 €). Facture du mois : un ordinateur portable pour le gérant, ${euros(ORDI)} HT + 360 € de TVA. Comment le comptabilises-tu ?`,
    options: () => [
      { label: "D 2183 Matériel informatique 1 800 / D 44562 TVA sur immobilisations 360 / C 404 Fournisseurs d'immobilisations 2 160", ok: true, maj: { saisie: true } },
      { label: "D 6063 Petit équipement 1 800 / D 44566 TVA 360 / C 401 Fournisseurs 2 160", ok: false, maj: { saisie: false } },
      { label: "D 607 Achats de marchandises 1 800 / D 44566 TVA 360 / C 401 Fournisseurs 2 160", ok: false, maj: { saisie: false } },
    ],
  },
  {
    titre: "Février — TVA",
    texte: () => `Déclaration de TVA de février : ventes 40 000 € HT (20 %), achats de biens et services 12 000 € HT (20 %), et la TVA de 360 € sur l'ordinateur. TVA à décaisser ?`,
    options: () => [
      { label: "5 240 €", ok: true, maj: { tvaOk: true } },
      { label: "5 600 € (sans la TVA sur l'ordinateur)", ok: false, maj: { tvaOk: false } },
      { label: "8 000 € (TVA collectée seule)", ok: false, maj: { tvaOk: false } },
    ],
  },
  {
    titre: "Mars — Paie",
    texte: () => `${CLIENT} embauche un salarié à 2 000 € brut par mois. Avec environ 42 % de charges patronales, quel coût annuel retiens-tu dans le budget et les comptes ?`,
    options: () => [
      { label: `${euros(COUT_SALARIE)} (2 000 × 12 × 1,42)`, ok: true, maj: { salaires: COUT_SALARIE } },
      { label: "24 000 € (le brut annuel)", ok: false, maj: { salaires: 24_000 } },
      { label: "18 720 € (le net annuel)", ok: false, maj: { salaires: 18_720 } },
    ],
  },
  {
    titre: "Décembre — Clôture",
    texte: (fr) =>
      `Clôture au 31/12. L'assurance annuelle de ${euros(ASSURANCE)} a été payée le 1er octobre. Montant des charges constatées d'avance ?${fr.v.saisie === false ? " (Ton collaborateur note au passage qu'aucun ordinateur ne figure dans les immobilisations…)" : " L'ordinateur est amorti sur 3 ans : 600 € de dotation."}`,
    options: () => [
      { label: "900 € (9 mois sur 12 concernent l'exercice suivant)", ok: true, maj: { cca: 900 } },
      { label: "300 €", ok: false, maj: { cca: 300 } },
      { label: "Aucune : la charge est payée", ok: false, maj: { cca: 0 } },
    ],
  },
  {
    titre: "Avril N+1 — Liasse et IS",
    texte: (fr) => {
      const c = chiffres(fr.v);
      return `Liasse fiscale : d'après tes écritures, le résultat fiscal de l'${CLIENT} est de ${euros(c.resultat)} (PME éligible au taux réduit). Montant de l'IS ?`;
    },
    options: (fr) => {
      const c = chiffres(fr.v);
      const juste = isPme(c.resultat);
      return [
        { label: `${euros(juste)} (15 % jusqu'à 42 500 €, 25 % au-delà)`, ok: true, maj: { is: juste } },
        { label: `${euros(c.resultat * 0.25)} (25 % sur tout)`, ok: false, maj: { is: Math.round(c.resultat * 0.25) } },
        { label: `${euros(c.resultat * 0.15)} (15 % sur tout)`, ok: false, maj: { is: Math.round(c.resultat * 0.15) } },
      ].sort((a, b) => a.label.localeCompare(b.label));
    },
  },
  {
    titre: "Juin N+1 — Assemblée générale",
    texte: (fr) => {
      const c = chiffres(fr.v);
      return `AG d'approbation. Résultat net selon tes comptes : ${euros(c.net)}. La réserve légale atteint 400 € pour un capital de 10 000 €. Quelle dotation à la réserve légale ?`;
    },
    options: (fr) => {
      const c = chiffres(fr.v);
      return [
        { label: `${euros(c.reserve)} (5 % du résultat, dans la limite de 10 % du capital)`, ok: true, maj: {} },
        { label: `${euros(c.net * 0.05)} (5 % sans plafond)`, ok: false, maj: {} },
        { label: "0 € : la réserve légale est facultative", ok: false, maj: {} },
      ];
    },
  },
];

export const NB_ETAPES_FR = ETAPES.length;

export function lancerFilRouge(e: Etat): string | null {
  if (e.filRouge && e.filRouge.etape < ETAPES.length) return "Le dossier fil rouge est déjà en cours.";
  e.filRouge = { etape: 0, prochain: jourDe(e.minute), score: 0, v: {}, erreurs: [] };
  etapeFilRouge(e, jourDe(e.minute));
  log(e, `📒 Nouveau dossier fil rouge : tu suis ${CLIENT} sur tout un exercice.`, "neutre");
  return null;
}

export function etapeFilRouge(e: Etat, jour: number) {
  const fr = e.filRouge;
  if (!fr || fr.etape >= ETAPES.length || fr.prochain > jour) return;
  const et = ETAPES[fr.etape];
  fr.prochain = 99999;
  const opts = et.options(fr);
  messageSpecial(
    e,
    "cabinet",
    4,
    `📒 Fil rouge ${CLIENT} — étape ${fr.etape + 1}/${ETAPES.length} : ${et.titre}`,
    et.texte(fr),
    "client:|agent:",
    {},
    opts.map((o, i) => ({ label: o.label, cout: 0, effets: {}, resultat: "Écriture passée.", action: "vie", code: `fr:${fr.etape}:${i}` }) as OptionDilemme),
  );
}

export function repondreFilRouge(e: Etat, etape: number, i: number) {
  const fr = e.filRouge;
  if (!fr || fr.etape !== etape) return;
  const et = ETAPES[etape];
  const o = et.options(fr)[i];
  if (!o) return;
  if (o.ok) fr.score++;
  else fr.erreurs.push(`${et.titre} : ${o.label}`);
  Object.assign(fr.v, o.maj);
  fr.etape++;
  if (fr.etape < ETAPES.length) {
    fr.prochain = jourDe(e.minute) + 3;
    return;
  }
  // Bilan final : tes comptes face aux comptes justes.
  const moi = chiffres(fr.v);
  const ecart = moi.resultat - JUSTE.resultat;
  e.niveauDec = clamp(e.niveauDec + fr.score);
  e.compteurs.filRougeTermines = (e.compteurs.filRougeTermines ?? 0) + 1;
  e.compteurs.filRougeMeilleur = Math.max(e.compteurs.filRougeMeilleur ?? 0, fr.score);
  fr.bilan = `Résultat retenu ${euros(moi.resultat)} contre ${euros(JUSTE.resultat)} dans les comptes justes (écart ${ecart >= 0 ? "+" : ""}${euros(ecart)}). IS ${euros(moi.is)} contre ${euros(JUSTE.is)}.`;
  log(e, `📒 Fil rouge ${CLIENT} terminé : ${fr.score}/${ETAPES.length}. ${fr.bilan}`, fr.score >= 5 ? "bien" : "mal");
  if (fr.score === ETAPES.length) souvenir(e, "📒", `Dossier fil rouge parfait (${CLIENT})`);
}
