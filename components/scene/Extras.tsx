"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { dateDe, jourDe } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { parler } from "@/lib/reunion";
import Corps, { DEBOUT, animerSquelette, postureMarche, useSquelette, type Posture } from "./Corps";
import { ETAGES_AGENTS, POSITIONS } from "./positions";

// Décors et caméra : ton bureau personnalisé (diplôme, trophées, photos),
// les enfants de la crèche le mercredi, le gâteau d'anniversaire et la
// caméra qui suit un collaborateur.

/** Ton bureau (étage de direction) : diplôme encadré, trophées, photos de l'album. */
export function BureauDeco() {
  const diplomee = useJeu((s) => !!s.etat?.compteurs.diplomee);
  const trophees = useJeu((s) => Math.min(8, s.etat?.badges.length ?? 0));
  const photos = useJeu((s) => Math.min(5, s.etat?.souvenirs?.length ?? 0));
  return (
    <group>
      {/* étagère à trophées contre le mur du fond */}
      <mesh position={[-10.6, 1.6, -7.85]}>
        <boxGeometry args={[2.4, 0.06, 0.3]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      {Array.from({ length: trophees }).map((_, i) => (
        <group key={i} position={[-11.6 + (i % 8) * 0.28, 1.63, -7.85]}>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.12, 0.08, 0.12]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.07, 0.03, 0.2, 10]} />
            <meshStandardMaterial color="#ffc107" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      ))}
      {/* diplôme encadré */}
      {diplomee && (
        <group position={[-7.4, 2.2, -7.93]}>
          <mesh>
            <boxGeometry args={[0.9, 0.65, 0.04]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.78, 0.53]} />
            <meshStandardMaterial color="#fffaf0" />
          </mesh>
          <mesh position={[0, -0.12, 0.03]}>
            <circleGeometry args={[0.06, 16]} />
            <meshStandardMaterial color="#c62828" />
          </mesh>
        </group>
      )}
      {/* photos de l'album sur le mur latéral */}
      {Array.from({ length: photos }).map((_, i) => (
        <group key={i} position={[-11.93, 1.8 + (i % 2) * 0.55, -6.9 + i * 0.6]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[0.42, 0.32, 0.03]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.36, 0.26]} />
            <meshStandardMaterial color={["#90caf9", "#ffcc80", "#a5d6a7", "#f48fb1", "#ce93d8"][i]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Enfant({ x, z, couleur, decalage }: { x: number; z: number; couleur: string; decalage: number }) {
  const g = useRef<Group>(null);
  const sq = useSquelette();
  const pose = useRef<Posture>({ ...DEBOUT });
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + decalage;
    if (!g.current) return;
    const dx = Math.sin(t * 0.5) * 1.2;
    g.current.position.set(x + dx, 0, z + Math.cos(t * 0.35) * 0.6);
    g.current.rotation.y = Math.cos(t * 0.5) > 0 ? Math.PI / 2 : -Math.PI / 2;
    animerSquelette(sq, pose.current, postureMarche(t, 9), Math.min(dt, 0.1), 12);
  });
  return (
    <group ref={g} scale={0.58}>
      <Corps a={{ haut: couleur, bas: "#1565c0", peau: "#f1c7a5", cheveux: "#6b4423", coiffure: decalage > 1 ? "longue" : "courte" }} sq={sq} />
    </group>
  );
}

/** Le mercredi, les enfants de la crèche passent au rez-de-chaussée. */
export function EnfantsCreche() {
  const visible = useJeu((s) => !!s.etat?.compteurs.creche && dateDe(jourDe(s.etat.minute)).getUTCDay() === 3);
  if (!visible) return null;
  return (
    <group>
      <Enfant x={-8} z={5} couleur="#ef5350" decalage={0} />
      <Enfant x={-6.5} z={6.2} couleur="#ffca28" decalage={1.7} />
      <Enfant x={-9.5} z={6.5} couleur="#66bb6a" decalage={3.1} />
    </group>
  );
}

/** Gâteau d'anniversaire à la cafétéria. */
export function Gateau() {
  const visible = useJeu((s) => !!s.etat && s.etat.compteurs.anniversaireJour === jourDe(s.etat.minute));
  if (!visible) return null;
  return (
    <group position={[6, 0.78, 4]}>
      <mesh>
        <cylinderGeometry args={[0.32, 0.32, 0.22, 20]} />
        <meshStandardMaterial color="#f8bbd0" />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.04, 20]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {[-0.12, 0, 0.12].map((x) => (
        <group key={x} position={[x, 0.22, 0]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 0.14, 6]} />
            <meshStandardMaterial color="#42a5f5" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#ffb300" emissive="#ff8f00" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** La caméra suit le collaborateur choisi (« une journée dans la peau de »). */
export function Suiveur({ controles }: { controles: React.RefObject<OrbitControlsImpl | null> }) {
  const id = useJeu((s) => s.suivi);
  useFrame(() => {
    const c = controles.current;
    const p = id ? POSITIONS.get(id) : null;
    if (!c || !p) return;
    const dx = (p.x - c.target.x) * 0.06;
    const dz = (p.z - c.target.z) * 0.06;
    const d = new Vector3(dx, 0, dz);
    c.target.add(d);
    c.object.position.add(d);
    c.update();
  });
  return null;
}

const PENSEES: Record<string, string[]> = {
  travaille: ["💭 Ce rapprochement bancaire ne tombe pas juste…", "💭 Encore trois liasses avant ce soir.", "💭 Il faut que je relance ce client pour ses pièces.", "💭 Je vérifie la TVA et j'envoie."],
  pause: ["💭 Un café et j'y retourne.", "💭 Tu as vu le match hier ?", "💭 Vivement le week-end…"],
  dejeuner: ["💭 Le plat du jour est top !", "💭 On parle d'autre chose que de boulot ?"],
  reunion: ["💭 Je note les actions à faire.", "💭 J'ai une idée à proposer…"],
  formation: ["💭 Ça va me servir pour le DEC.", "💭 Intéressant, cette nouvelle règle."],
  sport: ["💭 Allez, encore une série !", "💭 Ça vide la tête."],
};

/** Hors 3D : bascule d'étage et pensées du collaborateur suivi. */
export function PenseesSuivi() {
  const id = useJeu((s) => s.suivi);
  const agir = useJeu((s) => s.agir);
  const voirEtage = useJeu((s) => s.voirEtage);
  useEffect(() => {
    if (!id) return;
    const t = setInterval(() => {
      const etat = useJeu.getState().etat;
      const a = etat?.agents.find((x) => x.id === id);
      if (!a) return;
      const etage = ETAGES_AGENTS.get(id);
      if (etage !== undefined && etage !== useJeu.getState().etageVue) voirEtage(etage);
      const liste = PENSEES[a.activite];
      if (liste && Math.random() < 0.5) agir(parler, id, liste[Math.floor(Math.random() * liste.length)]);
    }, 5000);
    return () => clearInterval(t);
  }, [id, agir, voirEtage]);
  return null;
}
