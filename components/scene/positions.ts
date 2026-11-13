// Registre partagé entre la scène 3D et la couche d'étiquettes HTML.
// La scène écrit la position de chaque personnage à chaque image ;
// le projecteur lit ces positions et déplace les étiquettes, sans passer
// par le rendu React (donc fluide et sans re-rendu).

export const POSITIONS = new Map<string, { x: number; y: number; z: number; visible: boolean }>();
export const ETIQUETTES = new Map<string, HTMLElement>();

/** Étage actuel de chaque personne (mis à jour par la scène). */
export const ETAGES_AGENTS = new Map<string, number>();
