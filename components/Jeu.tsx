"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useJeu } from "@/lib/store";
import NouvellePartie from "./ui/NouvellePartie";
import BarreHaut from "./ui/BarreHaut";
import Menu from "./ui/Menu";
import Aujourdhui from "./ui/Aujourdhui";
import Fiche from "./ui/Fiche";
import Tiroir from "./ui/Tiroir";
import Boss from "./ui/Boss";
import Absence from "./ui/Absence";
import Toast from "./ui/Toast";
import Modales from "./ui/Modales";
import Sons from "./Sons";
import Telephone from "./ui/Telephone";
import Decisions from "./ui/Decisions";

const Cabinet3D = dynamic(() => import("./scene/Cabinet3D"), {
  ssr: false,
  loading: () => <div className="chargement">Ouverture du cabinet…</div>,
});

export default function Jeu() {
  const [pret, setPret] = useState(false);
  const aUnePartie = useJeu((s) => s.etat !== null);
  const panneau = useJeu((s) => s.panneau);

  // Recharge la sauvegarde puis rattrape le temps passé hors de l'app.
  useEffect(() => {
    Promise.resolve(useJeu.persist.rehydrate()).then(() => {
      useJeu.getState().rattraper();
      setPret(true);
    });
  }, []);

  // Horloge : chaque seconde réelle, le jeu avance de `vitesse` minutes.
  useEffect(() => {
    if (!pret) return;
    const id = setInterval(() => {
      const e = useJeu.getState().etat;
      if (e && e.vitesse > 0 && !document.hidden) useJeu.getState().tic(e.vitesse);
    }, 1000);
    const retour = () => {
      if (!document.hidden) useJeu.getState().rattraper();
    };
    document.addEventListener("visibilitychange", retour);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", retour);
    };
  }, [pret]);

  if (!pret) return <div className="chargement">Chargement…</div>;
  if (!aUnePartie) return <NouvellePartie />;

  return (
    <div className="jeu">
      <Menu />
      <div className="principal">
        <BarreHaut />
        <div className="scene">
          <Cabinet3D />
          <Fiche />
          {panneau === "cabinet" && <Aujourdhui />}
          {panneau !== "cabinet" && <Tiroir />}
          <Boss />
        </div>
      </div>
      <Absence />
      <Modales />
      <Sons />
      <Telephone />
      <Decisions />
      <Toast />
    </div>
  );
}
