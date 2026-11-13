"use client";

import { useMemo, useState } from "react";
import { dateCourte, heure } from "@/lib/calendrier";
import { choisirDilemme, coutMessage, repondre, resoudreCas, versionsGhostWriter, type Style } from "@/lib/moteur";
import { useJeu } from "@/lib/store";
import type { Etat, Message } from "@/lib/types";

const NIVEAU_LIB = ["", "N1", "N2", "N3", "N4", "N5"];

function expediteur(e: Etat, m: Message) {
  if (m.de === "cabinet") return { nom: "Le cabinet", couleur: "#3d405b", initiales: "EZ" };
  const a = e.agents.find((x) => x.id === m.de);
  if (a) return { nom: `${a.prenom} ${a.nom}`, couleur: a.couleur, initiales: a.prenom[0] + a.nom[0] };
  return { nom: "Ancien collaborateur", couleur: "#999", initiales: "?" };
}

export default function Messages() {
  const e = useJeu((s) => s.etat)!;
  const ouvert = useJeu((s) => s.messageOuvert);
  const ouvrirMessage = useJeu((s) => s.ouvrirMessage);
  const [filtre, setFiltre] = useState<"attente" | "tous">("attente");
  const liste = e.messages.filter((m) => (filtre === "attente" ? m.statut === "attente" || (!m.lu && m.statut === "info") : true));
  const m = e.messages.find((x) => x.id === ouvert);

  if (m) return <Detail m={m} retour={() => ouvrirMessage(null)} />;

  return (
    <div>
      <div className="onglets">
        <button className={filtre === "attente" ? "actif" : ""} onClick={() => setFiltre("attente")}>
          À traiter ({e.messages.filter((x) => x.statut === "attente").length})
        </button>
        <button className={filtre === "tous" ? "actif" : ""} onClick={() => setFiltre("tous")}>
          Tous
        </button>
      </div>
      <p className="aide">
        N1/N2 : gratuits (3 par jour, {Math.max(0, 3 - e.gratuitsUtilises)} restants) · N3/N4 : 1 PA · N5 : 2 PA. Sans réponse
        avant l&apos;expiration, la confiance baisse.
      </p>
      {liste.length === 0 && <p className="vide">Rien à traiter. Profite du calme.</p>}
      <ul className="liste-messages">
        {liste.map((x) => {
          const ex = expediteur(e, x);
          return (
            <li key={x.id}>
              <button className={`ligne-message ${x.lu ? "" : "non-lu"} n${x.niveau}`} onClick={() => ouvrirMessage(x.id)}>
                <span className="avatar" style={{ background: ex.couleur }}>
                  {ex.initiales}
                </span>
                <span className="contenu">
                  <span className="haut">
                    <strong>{ex.nom}</strong>
                    <span className={`niveau-badge n${x.niveau}`}>{NIVEAU_LIB[x.niveau]}</span>
                    <small>
                      {dateCourte(x.jour)} {heure(x.minute)}
                    </small>
                  </span>
                  <span className="sujet">{x.sujet}</span>
                  <span className="extrait">{x.texte}</span>
                </span>
                {x.statut === "repondu" && <span className="etat ok">Répondu</span>}
                {x.statut === "ignore" && <span className="etat ko">Ignoré</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Detail({ m, retour }: { m: Message; retour: () => void }) {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [brouillon, setBrouillon] = useState("");
  const [style, setStyle] = useState<Style>("standard");
  const ex = expediteur(e, m);
  const cout = coutMessage(e, m.niveau);
  const versions = useMemo(() => versionsGhostWriter(e, m, brouillon), [e, m, brouillon]);
  const peutRepondre = m.statut === "attente" || (m.statut === "info" && ["rumeur", "merci"].includes(m.theme));

  return (
    <div className="detail-message">
      <button className="lien" onClick={retour}>
        ← Retour
      </button>
      <div className="entete-message">
        <span className="avatar" style={{ background: ex.couleur }}>
          {ex.initiales}
        </span>
        <div>
          <strong>{ex.nom}</strong>
          <small>
            {dateCourte(m.jour)} à {heure(m.minute)} · <span className={`niveau-badge n${m.niveau}`}>{NIVEAU_LIB[m.niveau]}</span>
            {m.statut === "attente" && <> · expire le {dateCourte(m.expire)}</>}
          </small>
        </div>
      </div>
      <h3>{m.sujet}</h3>
      <p className="texte-message">{m.texte}</p>

      {m.reponse && (
        <div className="reponse-envoyee">
          <small>Ta réponse</small>
          <p>{m.reponse}</p>
        </div>
      )}

      {m.dilemme && m.statut === "attente" && (
        <div className="options-dilemme">
          <h4>Que décides-tu ?</h4>
          {m.dilemme.options.map((o, i) => (
            <button key={i} className="option" disabled={e.pa < o.cout} onClick={() => agir(choisirDilemme, m.id, i)}>
              <span>{o.label}</span>
              <em>{o.cout === 0 ? "Gratuit" : `${o.cout} PA`}</em>
            </button>
          ))}
          <p className="aide">Chaque choix a une conséquence immédiate… et une autre, invisible, qui tombera plus tard.</p>
        </div>
      )}

      {m.cas && <Cas m={m} />}

      {!m.dilemme && !m.cas && peutRepondre && (
        <div className="ghost-writer">
          <h4>✍️ Ghost Writer</h4>
          <textarea
            placeholder="Tape ton idée en quelques mots (facultatif)…"
            value={brouillon}
            onChange={(ev) => setBrouillon(ev.target.value)}
            rows={2}
            maxLength={400}
          />
          <div className="versions">
            {(["standard", "ferme", "pedagogue"] as Style[]).map((s) => (
              <button key={s} className={`version ${style === s ? "actif" : ""}`} onClick={() => setStyle(s)}>
                <strong>{s === "standard" ? "Standard" : s === "ferme" ? "Ferme" : "Pédagogue"}</strong>
                <span>{versions[s]}</span>
              </button>
            ))}
          </div>
          <button
            className="bouton principal-btn"
            disabled={e.pa < cout}
            onClick={() => {
              agir(repondre, m.id, style, versions[style]);
            }}
          >
            Envoyer {cout === 0 ? "(gratuit)" : `(${cout} PA)`}
          </button>
          {e.pa < cout && <p className="aide">Plus assez de PA aujourd&apos;hui. Ils reviennent demain matin.</p>}
        </div>
      )}
    </div>
  );
}

function Cas({ m }: { m: Message }) {
  const agir = useJeu((s) => s.agir);
  const [choix, setChoix] = useState<number | null>(null);
  const cas = m.cas!;
  const repondu = m.statut !== "attente";
  const reponseIndex = repondu ? cas.choix.indexOf(m.reponse ?? "") : choix;
  const montre = repondu || choix !== null;
  return (
    <div className="cas-pratique">
      <h4>🧮 Cas pratique — {cas.theme}</h4>
      <p className="enonce">{cas.enonce}</p>
      <div className="choix">
        {cas.choix.map((c, k) => (
          <button
            key={k}
            disabled={montre}
            className={`choix-btn ${montre && k === cas.bonne ? "bon" : ""} ${montre && k === reponseIndex && k !== cas.bonne ? "faux" : ""}`}
            onClick={() => {
              setChoix(k);
              agir(resoudreCas, m.id, k);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      {montre && (
        <div className="explication">
          <strong>{reponseIndex === cas.bonne ? "✔ Bien tranché : le dossier avance." : "✘ Raté : la révision repart en arrière, la notion part dans ton carnet."}</strong>
          <p>{cas.explication}</p>
        </div>
      )}
      {!montre && <p className="aide">Gratuit (pas de PA). Bonne réponse : le dossier avance et ton collaborateur progresse.</p>}
    </div>
  );
}
