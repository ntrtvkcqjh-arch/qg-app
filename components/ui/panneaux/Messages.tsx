"use client";

import { useMemo, useState } from "react";
import { dateCourte, heure } from "@/lib/calendrier";
import { choisirDilemme, repondre, resoudreCas, versionsGhostWriter, type Style } from "@/lib/moteur";
import { useJeu } from "@/lib/store";
import type { Etat, Message } from "@/lib/types";

const NIVEAU_LIB = ["", "N1", "N2", "N3", "N4", "N5"];

const CANAL = { mail: "✉️", appel: "📞", interne: "💬" } as const;
const canalDe = (m: Message) => m.canal ?? (m.de === "cabinet" ? "mail" : "interne");
const adresse = (prenom: string, nom: string) =>
  `${prenom}.${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z.]/g, "") + "@cabinet-ez.fr";

function expediteur(e: Etat, m: Message) {
  if (m.de === "cabinet") return { nom: "Le cabinet", couleur: "#3d405b", initiales: "EZ", mail: "secretariat@cabinet-ez.fr" };
  const a = e.agents.find((x) => x.id === m.de);
  if (a) return { nom: `${a.prenom} ${a.nom}`, couleur: a.couleur, initiales: a.prenom[0] + a.nom[0], mail: adresse(a.prenom, a.nom) };
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
          📥 Boîte de réception · à traiter ({e.messages.filter((x) => x.statut === "attente").length})
        </button>
        <button className={filtre === "tous" ? "actif" : ""} onClick={() => setFiltre("tous")}>
          Tous
        </button>
      </div>
      <p className="aide">
        N1 à N5 : du moins urgent au plus urgent. Sans réponse
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
                    <span title={canalDe(x) === "appel" ? "Appel téléphonique" : canalDe(x) === "mail" ? "E-mail" : "Message interne"}>{CANAL[canalDe(x)]}</span>
                    <strong>{canalDe(x) === "appel" ? (x.lu ? "Appel" : "Appel manqué") : ex.nom}</strong>
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

export function Detail({ m, retour }: { m: Message; retour?: () => void }) {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [brouillon, setBrouillon] = useState("");
  const [style, setStyle] = useState<Style>("standard");
  const ex = expediteur(e, m);
  const versions = useMemo(() => versionsGhostWriter(e, m, brouillon), [e, m, brouillon]);
  const peutRepondre = m.statut === "attente" || (m.statut === "info" && ["rumeur", "merci"].includes(m.theme));

  return (
    <div className="detail-message">
      {retour && (
        <button className="lien" onClick={retour}>
          ← Retour
        </button>
      )}
      <div className="entete-message">
        <span className="avatar" style={{ background: ex.couleur }}>
          {ex.initiales}
        </span>
        <div>
          <strong>{canalDe(m) === "appel" ? "📞 Appel téléphonique" : ex.nom}</strong>
          {canalDe(m) !== "appel" && "mail" in ex && <small>{CANAL[canalDe(m)]} {ex.mail}</small>}
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
          {(e.compteurs.formeToi ?? 100) < 35 && m.dilemme.options.length > 2 && <p className="aide">😴 Tu es épuisée : tu ne vois que les options les plus évidentes. Repose-toi !</p>}
          {m.dilemme.options.slice(0, (e.compteurs.formeToi ?? 100) < 35 ? 2 : undefined).map((o, i) => (
            <button key={i} className="option" onClick={() => agir(choisirDilemme, m.id, i)}>
              <span>{o.label}</span>
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
            onClick={() => {
              agir(repondre, m.id, style, versions[style]);
            }}
          >
            Envoyer
          </button>
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
      {!montre && <p className="aide">Bonne réponse : le dossier avance et ton collaborateur progresse.</p>}
    </div>
  );
}
