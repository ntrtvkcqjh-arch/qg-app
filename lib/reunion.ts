import { jourDe } from "@/lib/calendrier";
import { POLES } from "@/lib/data/developpement";
import { clamp, dire, genererCandidats, inc, log, nomClient, pick } from "@/lib/moteur";
import type { Agent, Etat, Filiere } from "@/lib/types";

// Réunion live des managers : ils se parlent entre eux à partir de l'état
// réel du cabinet (retards, charge, stress, clients, trésorerie), puis te
// posent leurs questions. Tu réponds par un bouton ou en écrivant librement.
// Tout est écrit à l'avance : aucune API.

export type Ligne = { de: string; texte: string };
export type OptionReunion = { label: string; code: string; mots: string[]; reaction: string };
export type Sujet = { id: string; titre: string; lignes: Ligne[]; question: Ligne; options: OptionReunion[]; pole?: Filiere };


/** Managers présents : associés, chefs de pôle, RH, chefs de mission (6 au plus). */
export function participants(e: Etat): Agent[] {
  const presents = e.agents.filter((a) => !["absent", "conge", "malade", "evacuation"].includes(a.activite));
  const chefs = new Set(Object.values(e.chefsPoles ?? {}));
  const score = (a: Agent) => (a.filiere === "associe" ? 4 : chefs.has(a.id) ? 3 : a.filiere === "rh" ? 2 : /chef|manager|senior|responsable/i.test(a.poste) ? 1 : 0);
  const liste = presents.filter((a) => score(a) > 0 && a.filiere !== "service").sort((a, b) => score(b) - score(a));
  if (liste.length < 2) liste.push(...presents.filter((a) => a.filiere !== "service" && !liste.includes(a)).sort((a, b) => b.competence - a.competence).slice(0, 3 - liste.length));
  return liste.slice(0, 6);
}

// Ton selon la personnalité.
const TON: Record<string, { accord: string; inquiet: string; idee: string }> = {
  perfectionniste: { accord: "D'accord, mais je veux une revue qualité derrière.", inquiet: "Si on bâcle, ça nous reviendra en contrôle qualité.", idee: "Je propose une check-list de révision commune." },
  anxieux: { accord: "Ok… si tout le monde suit.", inquiet: "Honnêtement, je ne vois pas comment on tient les délais.", idee: "On pourrait au moins prévenir les clients tôt ?" },
  ambitieux: { accord: "Parfait, on fonce.", inquiet: "On perd des parts de marché si on traîne.", idee: "C'est le moment de montrer qu'on est meilleurs que Corvane." },
  nonchalant: { accord: "Ça me va.", inquiet: "Bon… ça va être serré.", idee: "On peut simplifier, non ?" },
  sociable: { accord: "Super, je préviens l'équipe.", inquiet: "L'ambiance s'en ressent, je l'entends à la machine à café.", idee: "Et si on faisait un point d'équipe vendredi ?" },
  rebelle: { accord: "Si c'est ta décision…", inquiet: "On demande toujours plus aux mêmes.", idee: "Il faudrait revoir les process, pas pousser les gens." },
  loyal: { accord: "Compte sur moi.", inquiet: "On va le faire, mais l'équipe fatigue.", idee: "Je peux prendre une partie moi-même." },
};
const ton = (a: Agent) => TON[a.personnalite] ?? TON.loyal;

function chargeParPole(e: Etat) {
  const jour = jourDe(e.minute);
  return POLES.map((p) => {
    const equipe = e.agents.filter((a) => a.filiere === p.filiere);
    const dossiers = e.dossiers.filter((d) => d.phase < 5 && equipe.some((a) => a.id === d.agent));
    const retard = dossiers.filter((d) => d.echeance < jour);
    return { ...p, equipe, dossiers, retard, ratio: equipe.length ? dossiers.length / equipe.length : dossiers.length ? 99 : 0 };
  });
}

/** Ordre du jour construit à partir de la situation réelle. */
export function ordreDuJour(e: Etat, gens: Agent[]): Sujet[] {
  if (!gens.length) return [];
  const g = (i: number) => gens[i % gens.length];
  const chefDe = (f: Filiere) => gens.find((a) => a.id === e.chefsPoles?.[f] || a.associeDe === f || a.filiere === f) ?? g(0);
  const sujets: Sujet[] = [];
  const poles = chargeParPole(e);
  const jour = jourDe(e.minute);

  // 1. Tour de table
  const lignesTour: Ligne[] = gens.map((a) => {
    const p = poles.find((x) => x.filiere === (a.associeDe ?? a.filiere));
    if (a.filiere === "rh") return { de: a.id, texte: `Côté RH : ${e.candidats.length} candidature${e.candidats.length > 1 ? "s" : ""} en cours, moral moyen de l'équipe à ${Math.round(e.agents.reduce((s, x) => s + x.moral, 0) / Math.max(1, e.agents.length))}/100.` };
    if (!p) return { de: a.id, texte: "Rien de bloquant chez moi cette semaine." };
    return { de: a.id, texte: `${p.nom} : ${p.dossiers.length} dossier${p.dossiers.length > 1 ? "s" : ""} ouverts${p.retard.length ? `, dont ${p.retard.length} en retard` : ", aucun en retard"}. ${p.retard.length ? ton(a).inquiet : pick(["On est dans les temps.", "Rien de bloquant chez nous.", "Ça avance bien.", "L'équipe tient le rythme."])}` };
  });
  sujets.push({
    id: "tour",
    titre: "Tour de table",
    lignes: lignesTour,
    question: { de: g(0).id, texte: "Avant d'attaquer les sujets, tu veux fixer une priorité pour la semaine ?" },
    options: [
      { label: "Priorité aux échéances fiscales", code: "prio_echeances", mots: ["échéance", "fiscal", "tva", "délai"], reaction: "Clair. On trie les dossiers par échéance dès cet après-midi." },
      { label: "Priorité à la qualité des dossiers", code: "prio_qualite", mots: ["qualité", "révision", "erreur", "contrôle"], reaction: "Très bien, on renforce la revue avant validation." },
      { label: "Priorité au bien-être de l'équipe", code: "prio_equipe", mots: ["équipe", "stress", "bien-être", "fatigue", "ambiance"], reaction: "Ça va faire du bien. Je relaie le message." },
    ],
  });

  // 2. Retards
  const pire = [...poles].sort((a, b) => b.retard.length - a.retard.length)[0];
  if (pire && pire.retard.length) {
    const c = chefDe(pire.filiere);
    const autre = gens.find((a) => a !== c) ?? c;
    const d = pire.retard[0];
    sujets.push({
      id: "retards",
      pole: pire.filiere,
      titre: `Retards au ${pire.nom}`,
      lignes: [
        { de: c.id, texte: `${pire.retard.length} dossier${pire.retard.length > 1 ? "s" : ""} en retard chez nous, le plus urgent : ${d.titre} pour ${nomClient(e, d.client)}.` },
        { de: autre.id, texte: pire.retard.length > 2 ? "Je peux te prêter quelqu'un deux jours, mais pas plus." : "C'est rattrapable si on s'organise." },
        { de: c.id, texte: ton(c).inquiet },
        { de: autre.id, texte: ton(autre).idee },
      ],
      question: { de: c.id, texte: "Qu'est-ce qu'on fait pour rattraper ?" },
      options: [
        { label: "Heures sup payées cette semaine", code: "retard_hs", mots: ["heure", "sup", "soir", "rester"], reaction: "Ok, je fais passer le message. Les heures seront majorées." },
        { label: "Prêt d'un collaborateur d'un autre pôle", code: "retard_pret", mots: ["prêt", "renfort", "aide", "autre pôle"], reaction: "Je t'envoie quelqu'un dès demain matin." },
        { label: "J'appelle les clients pour décaler", code: "retard_report", mots: ["décaler", "report", "appeler", "client", "délai"], reaction: "Merci, ça soulage l'équipe. On note les nouvelles dates." },
        { label: "Je prends un dossier moi-même", code: "retard_moi", mots: ["moi", "je prends", "je m'en occupe"], reaction: "Ah, top ! Je te transmets le dossier le plus urgent." },
      ],
    });
  }

  // 3. Charge de travail / recrutement
  const charge = [...poles].filter((p) => p.equipe.length || p.dossiers.length).sort((a, b) => b.ratio - a.ratio)[0];
  if (charge && charge.ratio > 3.5) {
    const c = chefDe(charge.filiere);
    const rh = gens.find((a) => a.filiere === "rh") ?? gens.find((a) => a !== c) ?? c;
    sujets.push({
      id: "charge",
      pole: charge.filiere,
      titre: `Charge du ${charge.nom}`,
      lignes: [
        { de: c.id, texte: `On est à ${charge.ratio.toFixed(1)} dossiers par personne. Au-delà de 3, la qualité baisse.` },
        { de: rh.id, texte: rh.filiere === "rh" ? "Un recrutement prend 4 à 6 semaines, période d'essai comprise. Il faut décider maintenant." : "On ne peut pas continuer à empiler." },
        { de: c.id, texte: ton(c).idee },
      ],
      question: { de: rh.id, texte: "On lance un recrutement ?" },
      options: [
        { label: "Oui, lance le recrutement", code: "charge_recruter", mots: ["oui", "recrut", "embauche", "lance"], reaction: "Je publie l'annonce aujourd'hui, tu auras des candidats dans l'onglet Équipe." },
        { label: "Un CDD de 3 mois pour la saison", code: "charge_cdd", mots: ["cdd", "intérim", "temporaire", "saison"], reaction: "Bonne idée pour passer le pic. Je contacte l'agence." },
        { label: "On refuse les nouveaux clients ce mois-ci", code: "charge_gel", mots: ["refus", "gel", "stop", "nouveaux clients"], reaction: "Compris, on met les prospects en attente." },
        { label: "On tient comme ça", code: "charge_rien", mots: ["non", "tenir", "pas maintenant"], reaction: "D'accord… mais je te préviens si ça craque." },
      ],
    });
  }

  // 4. Stress de l'équipe
  const stress = e.agents.length ? e.agents.reduce((s, a) => s + a.stress, 0) / e.agents.length : 0;
  if (stress > 45) {
    const a = gens.find((x) => x.personnalite === "sociable" || x.filiere === "rh") ?? g(1);
    const b = gens.find((x) => x !== a) ?? a;
    sujets.push({
      id: "stress",
      titre: "Fatigue de l'équipe",
      lignes: [
        { de: a.id, texte: `Le stress moyen est à ${Math.round(stress)}/100. Deux personnes m'ont parlé d'épuisement cette semaine.` },
        { de: b.id, texte: ton(b).inquiet },
        { de: a.id, texte: "Si on ne fait rien, on aura des arrêts maladie avant la fin du mois." },
      ],
      question: { de: a.id, texte: "On fait un geste pour l'équipe ?" },
      options: [
        { label: "Vendredi après-midi offert", code: "stress_off", mots: ["vendredi", "après-midi", "repos", "off", "congé"], reaction: "Ils vont adorer. Je l'annonce ce soir." },
        { label: "Afterwork et séance de sport payés", code: "stress_afterwork", mots: ["afterwork", "sport", "soirée", "apéro"], reaction: "Je réserve pour jeudi !" },
        { label: "Prime exceptionnelle de 300 €", code: "stress_prime", mots: ["prime", "argent", "bonus"], reaction: "Ça va être très apprécié, surtout en ce moment." },
        { label: "C'est la saison, on serre les dents", code: "stress_rien", mots: ["non", "saison", "serre", "tenir"], reaction: "Ok… je ferai passer le message, mais ça ne va pas plaire." },
      ],
    });
  }

  // 5. Client mécontent
  const client = [...e.clients].sort((a, b) => a.satisfaction - b.satisfaction)[0];
  if (client && client.satisfaction < 55) {
    const a = gens.find((x) => e.dossiers.some((d) => d.client === client.id && d.agent === x.id)) ?? g(0);
    sujets.push({
      id: "client",
      titre: `${client.nom} mécontent`,
      lignes: [
        { de: a.id, texte: `${client.dirigeant} (${client.nom}) m'a appelé hier : satisfaction à ${Math.round(client.satisfaction)}/100, il parle d'aller voir un autre cabinet.` },
        { de: g(1).id, texte: `C'est un client à ${client.forfait.toLocaleString("fr-FR")} € d'honoraires, on ne peut pas le perdre bêtement.` },
        { de: a.id, texte: `Il faut dire qu'il ${client.trait}.` },
      ],
      question: { de: a.id, texte: "Comment on le récupère ?" },
      options: [
        { label: "Je l'appelle moi-même", code: "client_appel", mots: ["appel", "moi", "rendez-vous", "je l'appelle"], reaction: "Il sera sensible à un appel de l'associée." },
        { label: "Geste commercial de 10 %", code: "client_geste", mots: ["geste", "remise", "réduction", "%"], reaction: "Je lui annonce la remise sur la prochaine facture." },
        { label: "Changer d'interlocuteur", code: "client_change", mots: ["changer", "interlocuteur", "autre collaborateur"], reaction: "Ok, je fais la passation proprement." },
        { label: "Tant pis s'il part", code: "client_laisse", mots: ["tant pis", "partir", "laisse"], reaction: "Compris. On fera une lettre de fin de mission propre." },
      ],
    });
  }

  // 6. Trésorerie
  const masse = e.agents.reduce((s, a) => s + a.salaire, 0) * 1.45;
  if (e.tresorerie < masse * 2) {
    const a = gens.find((x) => x.filiere === "associe") ?? g(0);
    sujets.push({
      id: "treso",
      titre: "Trésorerie tendue",
      lignes: [
        { de: a.id, texte: `Trésorerie à ${Math.round(e.tresorerie).toLocaleString("fr-FR")} €, moins de deux mois de masse salariale chargée.` },
        { de: g(1).id, texte: "Il reste des honoraires impayés, il faut relancer." },
      ],
      question: { de: a.id, texte: "On fait quoi sur la trésorerie ?" },
      options: [
        { label: "Relance des impayés cette semaine", code: "treso_relance", mots: ["relance", "impayé", "facture", "recouvrement"], reaction: "Je prépare les relances, avec indemnité de 40 € pour les retardataires." },
        { label: "Gel des dépenses non essentielles", code: "treso_gel", mots: ["gel", "dépense", "économie", "budget"], reaction: "Ok, plus d'achats sans ton accord." },
        { label: "Demander un découvert à la banque", code: "treso_banque", mots: ["banque", "découvert", "prêt", "emprunt"], reaction: "J'appelle notre chargé d'affaires." },
      ],
    });
  } else if (e.tresorerie > masse * 8) {
    const a = gens.find((x) => x.personnalite === "ambitieux") ?? g(0);
    sujets.push({
      id: "invest",
      titre: "Que faire de la trésorerie ?",
      lignes: [
        { de: a.id, texte: `On a ${Math.round(e.tresorerie).toLocaleString("fr-FR")} € en banque. Ce serait dommage de laisser dormir cet argent.` },
        { de: g(1).id, texte: "Investir dans les gens, c'est ce qui rapporte le plus dans un cabinet." },
      ],
      question: { de: a.id, texte: "On investit dans quoi ?" },
      options: [
        { label: "Budget formation pour tous", code: "invest_formation", mots: ["formation", "compétence", "cours"], reaction: "Je fais le plan de formation dès demain." },
        { label: "Campagne de communication", code: "invest_com", mots: ["communication", "pub", "marketing", "réseaux"], reaction: "On va faire parler de nous !" },
        { label: "Augmentations générales de 3 %", code: "invest_augm", mots: ["augment", "salaire", "3 %"], reaction: "Grosse nouvelle pour l'équipe, merci." },
      ],
    });
  }

  // 7. Prochaine échéance
  const ec = e.echeances.filter((x) => !x.resolue && x.jour >= jour).sort((a, b) => a.jour - b.jour)[0];
  if (ec && ec.jour - jour <= 10) {
    const a = gens.find((x) => x.filiere === "fiscal" || x.associeDe === "fiscal") ?? g(0);
    sujets.push({
      id: "echeance",
      titre: ec.nom,
      lignes: [
        { de: a.id, texte: `${ec.nom} dans ${ec.jour - jour} jour${ec.jour - jour > 1 ? "s" : ""}. Il faut que tout soit validé avant.` },
        { de: g(1).id, texte: "Je peux bloquer une matinée de validation collective." },
      ],
      question: { de: a.id, texte: "On s'organise comment ?" },
      options: [
        { label: "Matinée de validation collective", code: "ech_matinee", mots: ["matinée", "collective", "ensemble", "validation"], reaction: "Je bloque les agendas." },
        { label: "Chacun gère ses dossiers", code: "ech_chacun", mots: ["chacun", "autonome", "seul"], reaction: "Ok, chacun est responsable de ses déclarations." },
      ],
    });
  }

  return sujets.slice(0, 5);
}

/** Applique la décision prise pendant la réunion. */
export function decisionReunion(e: Etat, code: string, pole?: Filiere): string | null {
  const equipe = pole ? e.agents.filter((a) => a.filiere === pole) : e.agents;
  const tous = e.agents;
  const jour = jourDe(e.minute);
  const retard = e.dossiers.filter((d) => d.phase < 5 && d.echeance < jour && (!pole || equipe.some((a) => a.id === d.agent)));
  const note = (t: string, tonalite: "bien" | "mal" | "neutre" = "neutre") => log(e, `🎙️ Réunion : ${t}`, tonalite);
  switch (code) {
    case "prio_echeances": e.compteurs.prioReunion = 1; note("priorité aux échéances."); break;
    case "prio_qualite": e.compteurs.prioReunion = 2; for (const a of tous) a.competence = clamp(a.competence + 0.5); note("priorité à la qualité."); break;
    case "prio_equipe": e.compteurs.prioReunion = 3; for (const a of tous) a.moral = clamp(a.moral + 3); note("priorité à l'équipe.", "bien"); break;
    case "retard_hs":
      for (const d of retard) d.progression = Math.min(100, d.progression + 25);
      for (const a of equipe) a.stress = clamp(a.stress + 6);
      e.tresorerie -= 120 * equipe.length;
      note(`heures sup payées pour rattraper ${retard.length} dossier(s).`);
      break;
    case "retard_pret":
      for (const d of retard) d.progression = Math.min(100, d.progression + 15);
      for (const a of tous.filter((x) => !equipe.includes(x)).slice(0, 4)) a.stress = clamp(a.stress + 4);
      note("prêt d'un collaborateur entre pôles.");
      break;
    case "retard_report":
      for (const d of retard) {
        d.echeance = jour + 5;
        const c = e.clients.find((x) => x.id === d.client);
        if (c) c.satisfaction = clamp(c.satisfaction - 4);
      }
      for (const a of equipe) a.stress = clamp(a.stress - 8);
      note("échéances renégociées avec les clients.");
      break;
    case "retard_moi": {
      const d = retard[0];
      if (d) {
        d.agent = "toi";
        e.travailToi = d.id;
      }
      for (const a of equipe) a.confiance = clamp(a.confiance + 5);
      note("tu reprends un dossier en retard toi-même.", "bien");
      break;
    }
    case "charge_recruter": e.candidats = [...e.candidats, ...genererCandidats(e)].slice(-12); note("recrutement lancé.", "bien"); break;
    case "charge_cdd": e.candidats = [...e.candidats, ...genererCandidats(e).slice(0, 2)].slice(-12); e.tresorerie -= 400; note("recherche d'un CDD saisonnier."); break;
    case "charge_gel": e.compteurs.gelProspectsJusqua = jour + 30; for (const a of equipe) a.stress = clamp(a.stress - 5); note("gel des nouveaux clients pendant un mois."); break;
    case "charge_rien": for (const a of equipe) { a.moral = clamp(a.moral - 4); a.confiance = clamp(a.confiance - 3); } note("pas de renfort décidé.", "mal"); break;
    case "stress_off": for (const a of tous) { a.stress = clamp(a.stress - 15); a.moral = clamp(a.moral + 8); } note("vendredi après-midi offert.", "bien"); break;
    case "stress_afterwork": for (const a of tous) { a.stress = clamp(a.stress - 8); a.moral = clamp(a.moral + 6); } e.tresorerie -= 25 * tous.length; note("afterwork et sport offerts.", "bien"); break;
    case "stress_prime": for (const a of tous) { a.moral = clamp(a.moral + 10); a.confiance = clamp(a.confiance + 6); a.stress = clamp(a.stress - 4); } e.tresorerie -= 300 * 1.45 * tous.length; note("prime exceptionnelle de 300 €.", "bien"); break;
    case "stress_rien": for (const a of tous) { a.moral = clamp(a.moral - 5); a.confiance = clamp(a.confiance - 2); } note("pas de geste pour l'équipe.", "mal"); break;
    case "client_appel":
    case "client_geste":
    case "client_change":
    case "client_laisse": {
      const c = [...e.clients].sort((a, b) => a.satisfaction - b.satisfaction)[0];
      if (!c) break;
      if (code === "client_appel") c.satisfaction = clamp(c.satisfaction + 15);
      if (code === "client_geste") { c.satisfaction = clamp(c.satisfaction + 22); c.forfait = Math.round((c.forfait * 0.9) / 50) * 50; }
      if (code === "client_change") c.satisfaction = clamp(c.satisfaction + 10);
      if (code === "client_laisse") c.satisfaction = clamp(c.satisfaction - 15);
      note(`décision sur ${c.nom}.`);
      break;
    }
    case "treso_relance": e.tresorerie += 1500 + Math.round(e.clients.length * 120); note("relance des impayés.", "bien"); break;
    case "treso_gel": for (const a of tous) a.moral = clamp(a.moral - 2); e.compteurs.gelDepenses = jour + 30; note("gel des dépenses non essentielles."); break;
    case "treso_banque": e.tresorerie += 20000; e.compteurs.decouvert = (e.compteurs.decouvert ?? 0) + 20000; note("découvert de 20 000 € accordé par la banque."); break;
    case "invest_formation": for (const a of tous) a.competence = clamp(a.competence + 2); e.tresorerie -= 600 * tous.length; note("budget formation pour tous.", "bien"); break;
    case "invest_com": e.reputation = clamp(e.reputation + 5); e.tresorerie -= 8000; note("campagne de communication.", "bien"); break;
    case "invest_augm": for (const a of tous) { a.salaire = Math.round(a.salaire * 1.03); a.moral = clamp(a.moral + 10); a.confiance = clamp(a.confiance + 5); } note("augmentations générales de 3 %.", "bien"); break;
    case "ech_matinee": for (const d of e.dossiers.filter((x) => x.phase === 3)) d.progression = Math.min(100, d.progression + 20); for (const a of tous) a.stress = clamp(a.stress + 3); note("matinée de validation collective."); break;
    case "ech_chacun": note("chacun gère ses déclarations."); break;
    default: break;
  }
  return null;
}

/** Les managers rejoignent la salle du conseil (visible dans la 3D). */
export function ouvrirReunion(e: Etat, ids: string[]): string | null {
  for (const a of e.agents) {
    if (!ids.includes(a.id)) continue;
    a.activite = "reunion";
    a.activiteJusqua = e.minute + 120;
    a.enComite = true;
  }
  return null;
}

/** Fin de réunion : compte-rendu au journal, managers de retour à leur poste. */
export function cloreReunion(e: Etat, decisions: string[]): string | null {
  for (const a of e.agents) {
    if (!a.enComite) continue;
    a.enComite = false;
    a.activite = "travaille";
    a.activiteJusqua = e.minute;
    a.moral = clamp(a.moral + 2);
    dire(e, a, pick(["Bonne réunion !", "On s'y met.", "Je relaie à l'équipe.", "C'est noté."]), 30);
  }
  e.compteurs.reunionJour = jourDe(e.minute);
  inc(e, "reunions");
  log(e, `📝 Compte-rendu de la réunion des managers : ${decisions.length ? decisions.join(" · ") : "pas de décision"}.`, "neutre");
  return null;
}

// ---------- discussion libre ----------

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Cherche l'option qui correspond à ce que tu as écrit. */
export function interpreter(texte: string, options: OptionReunion[]): OptionReunion | null {
  const t = norm(texte);
  let meilleure: OptionReunion | null = null;
  let score = 0;
  for (const o of options) {
    const s = o.mots.filter((m) => t.includes(norm(m))).length;
    if (s > score) {
      score = s;
      meilleure = o;
    }
  }
  return meilleure;
}

/** Réponse d'un manager à une question libre, tirée des chiffres du cabinet. */
export function repondreLibre(e: Etat, texte: string, gens: Agent[]): Ligne {
  const t = norm(texte);
  const jour = jourDe(e.minute);
  const a = gens[Math.floor(Math.random() * gens.length)] ?? gens[0];
  const rh = gens.find((x) => x.filiere === "rh") ?? a;
  const poles = chargeParPole(e);
  const retard = e.dossiers.filter((d) => d.phase < 5 && d.echeance < jour);
  if (/retard|en retard|delai/.test(t)) return { de: a.id, texte: retard.length ? `${retard.length} dossier(s) en retard, surtout au ${[...poles].sort((x, y) => y.retard.length - x.retard.length)[0].nom}. Le plus ancien : ${retard[0].titre}.` : "Aucun dossier en retard pour l'instant 🎉" };
  if (/recrut|embauch|candidat/.test(t)) return { de: rh.id, texte: `${e.candidats.length} candidat(s) en attente dans l'onglet Équipe. Le pôle le plus chargé est le ${[...poles].sort((x, y) => y.ratio - x.ratio)[0].nom}.` };
  if (/stress|fatigu|moral|ambiance/.test(t)) {
    const s = Math.round(e.agents.reduce((x, y) => x + y.stress, 0) / Math.max(1, e.agents.length));
    const m = Math.round(e.agents.reduce((x, y) => x + y.moral, 0) / Math.max(1, e.agents.length));
    return { de: rh.id, texte: `Stress moyen ${s}/100, moral ${m}/100. ${s > 55 ? "Ça tire, il faudrait souffler." : "Ça va plutôt bien."}` };
  }
  if (/treso|banque|argent|cash/.test(t)) return { de: a.id, texte: `Trésorerie : ${Math.round(e.tresorerie).toLocaleString("fr-FR")} €.` };
  if (/client/.test(t)) {
    const c = [...e.clients].sort((x, y) => x.satisfaction - y.satisfaction)[0];
    return { de: a.id, texte: c ? `${e.clients.length} clients. Le moins satisfait : ${c.nom} (${Math.round(c.satisfaction)}/100).` : "Pas encore de clients." };
  }
  if (/teletravail|remote|maison/.test(t)) return { de: a.id, texte: "L'équipe aimerait 2 jours de télétravail. Tu peux le régler dans Équipe & RH." };
  if (/salaire|augment|prime/.test(t)) return { de: rh.id, texte: `Masse salariale brute : ${Math.round(e.agents.reduce((s, x) => s + x.salaire, 0)).toLocaleString("fr-FR")} € par mois. Les entretiens annuels sont le bon moment pour en parler.` };
  if (/formation|dec|competence/.test(t)) return { de: a.id, texte: "Les juniors demandent des formations sur la révision et la fiscalité. La salle de formation est dispo." };
  if (/merci|bravo|bien joue|felicit/.test(t)) return { de: a.id, texte: pick(["Merci à toi 🙏", "Ça fait plaisir, je transmets à l'équipe !", "On est une bonne équipe."]) };
  if (/echeance|tva|dsn|liasse|is\b/.test(t)) {
    const ec = e.echeances.filter((x) => !x.resolue && x.jour >= jour).sort((x, y) => x.jour - y.jour)[0];
    return { de: a.id, texte: ec ? `Prochaine échéance : ${ec.nom} dans ${ec.jour - jour} jour(s).` : "Pas d'échéance proche." };
  }
  return { de: a.id, texte: pick(["Bonne question, je regarde et je te reviens d'ici ce soir.", "Je note pour le prochain point.", "On en parle en bilatéral après ?", ton(a).idee]) };
}

/** Bulle au-dessus du manager dans la 3D pendant qu'il parle. */
export function parler(e: Etat, id: string, texte: string): string | null {
  const a = e.agents.find((x) => x.id === id);
  if (a) dire(e, a, texte.length > 48 ? texte.slice(0, 46) + "…" : texte, 6);
  return null;
}
