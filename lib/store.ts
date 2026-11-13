"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as M from "@/lib/moteur";
import type { Difficulte, Etat, ModeDepart, PieceId } from "@/lib/types";

// Le store garde l'état du jeu (sauvegardé dans le navigateur) et l'état
// d'interface (sélection, panneau ouvert), qui, lui, n'est pas sauvegardé.

export type Panneau = "cabinet" | "messages" | "demandes" | "dossiers" | "equipe" | "locaux" | "formation" | "bilans" | "badges" | "journal" | "reglages";

type Store = {
  etat: Etat | null;
  panneau: Panneau;
  selectionAgent: string | null;
  selectionPiece: PieceId | null;
  messageOuvert: string | null;
  toast: string | null;
  nouvelle: (d: Difficulte, nom: string, mode: ModeDepart) => void;
  reinitialiser: () => void;
  tic: (minutes: number) => void;
  rattraper: () => void;
  agir: <A extends unknown[]>(f: (e: Etat, ...args: A) => string | null | void | boolean, ...args: A) => void;
  setVitesse: (v: Etat["vitesse"]) => void;
  ouvrir: (p: Panneau) => void;
  selectionner: (agent: string | null) => void;
  selectionnerPiece: (p: PieceId | null) => void;
  ouvrirMessage: (id: string | null) => void;
  fermerAbsence: () => void;
  notifier: (t: string | null) => void;
};

export const useJeu = create<Store>()(
  persist(
    (set, get) => ({
      etat: null,
      panneau: "cabinet",
      selectionAgent: null,
      selectionPiece: null,
      messageOuvert: null,
      toast: null,
      nouvelle: (d, nom, mode) => set({ etat: M.nouvellePartie(d, nom, mode), panneau: "cabinet" }),
      reinitialiser: () => set({ etat: null, selectionAgent: null, messageOuvert: null }),
      tic: (minutes) => {
        const e = get().etat;
        if (!e || e.vitesse === 0) return;
        const c = structuredClone(e);
        M.avancer(c, minutes);
        c.derniereVisite = Date.now();
        set({ etat: c });
      },
      rattraper: () => {
        const e = get().etat;
        if (!e) return;
        const c = M.migrer(structuredClone(e));
        M.rattraper(c, Date.now());
        set({ etat: c });
      },
      agir: (f, ...args) => {
        const e = get().etat;
        if (!e) return;
        const c = structuredClone(e);
        const r = f(c, ...args);
        if (typeof r === "string") {
          set({ toast: r });
          return;
        }
        if (r === false) {
          set({ toast: "Action impossible." });
          return;
        }
        set({ etat: c });
      },
      setVitesse: (v) => {
        const e = get().etat;
        if (!e) return;
        set({ etat: { ...e, vitesse: v, derniereVisite: Date.now() } });
      },
      ouvrir: (p) => set({ panneau: p }),
      selectionner: (agent) => set({ selectionAgent: agent, selectionPiece: null }),
      selectionnerPiece: (p) => set({ selectionPiece: p, selectionAgent: null }),
      ouvrirMessage: (id) => {
        const e = get().etat;
        if (e && id) {
          const c = structuredClone(e);
          const m = c.messages.find((x) => x.id === id);
          if (m) m.lu = true;
          set({ etat: c, messageOuvert: id, panneau: "messages" });
        } else set({ messageOuvert: id });
      },
      fermerAbsence: () => {
        const e = get().etat;
        if (e) set({ etat: { ...e, absence: null } });
      },
      notifier: (t) => set({ toast: t }),
    }),
    {
      name: "cabinet-ez-v1",
      storage: createJSONStorage(() => window.localStorage),
      partialize: (s) => ({ etat: s.etat }),
      skipHydration: true,
    },
  ),
);
