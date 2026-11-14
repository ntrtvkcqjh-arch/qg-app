"use client";

import { useEffect, useRef, useState } from "react";
import { heure, jourDe } from "@/lib/calendrier";
import { cloreReunion, decisionReunion, interpreter, ordreDuJour, ouvrirReunion, parler, participants, repondreLibre, type Ligne, type OptionReunion, type Sujet } from "@/lib/reunion";
import { useJeu } from "@/lib/store";
import type { Agent } from "@/lib/types";

// Réunion live des managers : ils se parlent entre eux (bulles dans la 3D
// et fil de discussion), puis te posent leurs questions. Tu réponds par un
// bouton ou en écrivant librement.

type Msg = Ligne & { moi?: boolean; systeme?: boolean };

export default function Reunion() {
  const ouverte = useJeu((s) => s.reunionOuverte);
  const e = useJeu((s) => s.etat);
  const setReunion = useJeu((s) => s.setReunion);
  const ouvrirMessage = useJeu((s) => s.ouvrirMessage);
  if (!e) return null;
  const jour = jourDe(e.minute);
  const lundi = new Date(Date.UTC(1970, 0, 1 + jour)).getUTCDay() === 1;
  const mdj = e.minute % 1440;
  const invitation = !ouverte && lundi && mdj >= 600 && mdj < 1080 && e.compteurs.reunionJour !== jour && e.agents.length >= 2;
  if (ouverte) return <Salle />;
  return (
    <button className={`bouton-reunion ${invitation ? "invitation" : ""}`} onClick={() => {
        ouvrirMessage(null);
        setReunion(true);
      }}
    >
      🎙️ {invitation ? "La réunion du lundi commence — rejoindre" : "Réunion des managers"}
    </button>
  );
}

function Salle() {
  const etat = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const setReunion = useJeu((s) => s.setReunion);
  const [gens] = useState<Agent[]>(() => participants(etat));
  const [sujets] = useState<Sujet[]>(() => ordreDuJour(etat, gens));
  const [fil, setFil] = useState<Msg[]>([{ de: "", texte: `Réunion ouverte à ${heure(etat.minute)} · salle du conseil`, systeme: true }]);
  const [attente, setAttente] = useState<Msg[]>([]);
  const [etape, setEtape] = useState(0);
  const [question, setQuestion] = useState(false);
  const [decisions, setDecisions] = useState<string[]>([]);
  const [saisie, setSaisie] = useState("");
  const [debut] = useState(() => Date.now());
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const bas = useRef<HTMLDivElement>(null);
  const lance = useRef(-1);

  const nom = (id: string) => gens.find((a) => a.id === id) ?? etat.agents.find((a) => a.id === id);
  const sujet = sujets[etape];
  const fini = etape >= sujets.length;

  // Les managers rejoignent la salle du conseil.
  useEffect(() => {
    agir(ouvrirReunion, gens.map((a) => a.id));
  }, [agir, gens]);

  // Chronomètre de la réunion.
  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Chaque sujet : les répliques arrivent une à une, puis la question.
  useEffect(() => {
    if (lance.current === etape) return;
    lance.current = etape;
    const t = setTimeout(() => {
      if (sujet) setAttente((q) => [...q, { de: "", texte: `— ${etape + 1}. ${sujet.titre} —`, systeme: true }, ...sujet.lignes, { ...sujet.question }]);
      else setAttente((q) => [...q, { de: gens[0]?.id ?? "", texte: "On a fait le tour. Tu as d'autres questions ? Écris-les, sinon on clôt." }]);
    }, 400);
    return () => clearTimeout(t);
  }, [etape, sujet, gens]);

  // Lecture de la file : un message toutes les 1,2 à 2,4 secondes.
  useEffect(() => {
    if (!attente.length) return;
    const suivant = attente[0];
    const delai = suivant.systeme ? 500 : Math.min(2600, 900 + suivant.texte.length * 18);
    const t = setTimeout(() => {
      setFil((f) => [...f, suivant]);
      setAttente((q) => q.slice(1));
      if (!suivant.systeme && suivant.de) agir(parler, suivant.de, suivant.texte);
      if (sujet && suivant.texte === sujet.question.texte && suivant.de === sujet.question.de) setQuestion(true);
    }, delai);
    return () => clearTimeout(t);
  }, [attente, agir, sujet]);

  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [fil, attente]);

  function choisir(o: OptionReunion, texteLibre?: string) {
    if (!sujet) return;
    setQuestion(false);
    setFil((f) => [...f, { de: "moi", texte: texteLibre ?? o.label, moi: true }]);
    agir(decisionReunion, o.code, sujet.pole);
    setDecisions((d) => [...d, `${sujet.titre} : ${o.label}`]);
    const autre = gens.find((a) => a.id !== sujet.question.de) ?? gens[0];
    setAttente((q) => [...q, { de: sujet.question.de, texte: o.reaction }, ...(autre && autre.id !== sujet.question.de ? [{ de: autre.id, texte: commentaire(autre) }] : [])]);
    setTimeout(() => setEtape((x) => x + 1), 600);
  }

  function envoyer() {
    const t = saisie.trim();
    if (!t) return;
    setSaisie("");
    if (question && sujet) {
      const o = interpreter(t, sujet.options);
      if (o) return choisir(o, t);
    }
    setFil((f) => [...f, { de: "moi", texte: t, moi: true }]);
    setAttente((q) => [...q, repondreLibre(etat, t, gens)]);
  }

  function clore() {
    agir(cloreReunion, decisions);
    setReunion(false);
  }

  const parle = attente.find((m) => !m.systeme && m.de);
  const duree = Math.floor((maintenant - debut) / 1000);

  if (gens.length < 2)
    return (
      <div className="voile">
        <div className="modale">
          <h3>🎙️ Réunion des managers</h3>
          <p>Il faut au moins deux managers présents (associés, chefs de pôle, RH ou chefs de mission). Nomme des chefs de pôle dans Équipe & RH.</p>
          <button className="bouton principal-btn" onClick={() => setReunion(false)}>
            Fermer
          </button>
        </div>
      </div>
    );

  return (
    <div className="voile">
      <div className="modale reunion-live">
        <aside className="reunion-cote">
          <div className="reunion-titre">
            <span className="direct">● EN DIRECT</span>
            <strong>Réunion des managers</strong>
            <small>
              ⏱ {Math.floor(duree / 60)}:{String(duree % 60).padStart(2, "0")} · {gens.length} participants
            </small>
          </div>
          <ul className="participants">
            {gens.map((a) => (
              <li key={a.id} className={parle?.de === a.id ? "parle" : ""}>
                <span className="avatar" style={{ background: a.couleur }}>
                  {a.prenom[0]}
                  {a.nom[0]}
                </span>
                <span>
                  <strong>{a.prenom}</strong>
                  <small>{a.poste}</small>
                </span>
                {parle?.de === a.id && <em className="micro">🎤</em>}
              </li>
            ))}
          </ul>
          <h4>Ordre du jour</h4>
          <ol className="odj">
            {sujets.map((s, i) => (
              <li key={s.id} className={i < etape ? "fait" : i === etape ? "courant" : ""}>
                {i < etape ? "✔ " : ""}
                {s.titre}
              </li>
            ))}
            <li className={fini ? "courant" : ""}>Questions diverses</li>
          </ol>
          <button className="bouton" onClick={clore}>
            ✅ Clore la réunion
          </button>
        </aside>
        <section className="reunion-chat">
          <div className="fil">
            {fil.map((m, i) => {
              if (m.systeme)
                return (
                  <div key={i} className="msg-systeme">
                    {m.texte}
                  </div>
                );
              const a = nom(m.de);
              return (
                <div key={i} className={`msg ${m.moi ? "moi" : ""}`}>
                  {!m.moi && (
                    <span className="avatar petit" style={{ background: a?.couleur ?? "#999" }}>
                      {a?.prenom[0]}
                    </span>
                  )}
                  <div className="contenu">
                    {!m.moi && <small>{a ? `${a.prenom} · ${a.poste}` : ""}</small>}
                    <p>{m.texte}</p>
                  </div>
                </div>
              );
            })}
            {parle && (
              <div className="msg ecrit">
                <span className="avatar petit" style={{ background: nom(parle.de)?.couleur ?? "#999" }}>
                  {nom(parle.de)?.prenom[0]}
                </span>
                <div className="contenu">
                  <small>{nom(parle.de)?.prenom} écrit…</small>
                  <p className="points">
                    <i />
                    <i />
                    <i />
                  </p>
                </div>
              </div>
            )}
            <div ref={bas} />
          </div>
          {question && sujet && !attente.length && (
            <div className="options-reunion">
              {sujet.options.map((o) => (
                <button key={o.code} className="option" onClick={() => choisir(o)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
          <form
            className="saisie-reunion"
            onSubmit={(ev) => {
              ev.preventDefault();
              envoyer();
            }}
          >
            <input value={saisie} onChange={(ev) => setSaisie(ev.target.value)} placeholder={question ? "Réponds ou pose ta question (ex. « on recrute », « combien de retards ? »)…" : "Pose une question à tes managers…"} maxLength={300} />
            <button className="bouton principal-btn" type="submit">
              Envoyer
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function commentaire(a: Agent) {
  const c: Record<string, string> = {
    perfectionniste: "Je mets un point de contrôle dans deux semaines.",
    anxieux: "Ok, ça me rassure un peu.",
    ambitieux: "Bien, on avance !",
    nonchalant: "Ça marche pour moi.",
    sociable: "Je préviens tout le monde à la pause.",
    rebelle: "On verra si ça suffit.",
    loyal: "Je m'en occupe.",
  };
  return c[a.personnalite] ?? "Noté.";
}
