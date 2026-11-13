"use client";

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

// Textures générées à la volée (aucun fichier à télécharger) : parquet,
// moquette, carrelage, béton et vue sur la ville par les fenêtres.

const cache = new Map<string, CanvasTexture>();

function creer(cle: string, l: number, h: number, dessin: (c: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const ex = cache.get(cle);
  if (ex) return ex;
  const canvas = document.createElement("canvas");
  canvas.width = l;
  canvas.height = h;
  const c = canvas.getContext("2d")!;
  dessin(c);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 4;
  cache.set(cle, t);
  return t;
}

/** Petit générateur pseudo-aléatoire déterministe. */
function alea(graine: number) {
  let s = graine;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type Revetement = "parquet" | "moquette" | "carrelage" | "beton";

export function revetement(type: Revetement, largeur: number, profondeur: number) {
  const rep: [number, number] = [Math.max(1, largeur / 3), Math.max(1, profondeur / 3)];
  const r = alea(type.length * 97 + 13);
  switch (type) {
    case "parquet":
      return creer(`parquet-${largeur}-${profondeur}`, 256, 256, (c) => {
        for (let y = 0; y < 256; y += 32) {
          let x = (y / 32) % 2 ? -64 : 0;
          while (x < 256) {
            const lame = 96 + r() * 64;
            const l = 200 + r() * 40;
            c.fillStyle = `rgb(${l},${l * 0.82},${l * 0.62})`;
            c.fillRect(x, y, lame, 32);
            c.fillStyle = "rgba(90,60,30,0.12)";
            for (let k = 0; k < 6; k++) c.fillRect(x, y + r() * 32, lame, 1);
            c.fillStyle = "rgba(70,45,20,0.35)";
            c.fillRect(x, y, 1.5, 32);
            x += lame;
          }
          c.fillStyle = "rgba(70,45,20,0.35)";
          c.fillRect(0, y, 256, 1.5);
        }
      }, rep);
    case "moquette":
      return creer(`moquette-${largeur}-${profondeur}`, 128, 128, (c) => {
        c.fillStyle = "#e6e9ef";
        c.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 2600; i++) {
          const v = 200 + r() * 55;
          c.fillStyle = `rgba(${v},${v},${v + 5},0.5)`;
          c.fillRect(r() * 128, r() * 128, 1.5, 1.5);
        }
        c.strokeStyle = "rgba(0,0,0,0.05)";
        for (let k = 0; k <= 128; k += 64) {
          c.beginPath();
          c.moveTo(k, 0);
          c.lineTo(k, 128);
          c.moveTo(0, k);
          c.lineTo(128, k);
          c.stroke();
        }
      }, rep);
    case "carrelage":
      return creer(`carrelage-${largeur}-${profondeur}`, 128, 128, (c) => {
        for (let y = 0; y < 128; y += 32)
          for (let x = 0; x < 128; x += 32) {
            const v = 235 + r() * 15;
            c.fillStyle = `rgb(${v},${v - 3},${v - 8})`;
            c.fillRect(x, y, 32, 32);
          }
        c.fillStyle = "rgba(120,110,100,0.4)";
        for (let k = 0; k < 128; k += 32) {
          c.fillRect(k, 0, 1.5, 128);
          c.fillRect(0, k, 128, 1.5);
        }
      }, rep);
    case "beton":
      return creer(`beton-${largeur}-${profondeur}`, 128, 128, (c) => {
        c.fillStyle = "#e3e1dc";
        c.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 1800; i++) {
          const v = 190 + r() * 60;
          c.fillStyle = `rgba(${v},${v},${v},0.35)`;
          c.beginPath();
          c.arc(r() * 128, r() * 128, r() * 2.2, 0, Math.PI * 2);
          c.fill();
        }
      }, rep);
  }
}

/** Vue sur la ville : ciel, immeubles, fenêtres allumées la nuit, pluie ou neige. */
export function skyline(ciel: string, nuit: boolean, meteo: string) {
  return creer(`sky-${ciel}-${nuit}-${meteo}`, 256, 128, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, ciel);
    g.addColorStop(1, nuit ? "#20284a" : meteo === "pluie" || meteo === "nuages" ? "#c9d1da" : "#e9f2fb");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 128);
    const r = alea(7);
    let x = 0;
    while (x < 256) {
      const l = 18 + r() * 30;
      const h = 30 + r() * 70;
      c.fillStyle = nuit ? "#151a30" : meteo === "pluie" ? "#8b97a6" : "#9fb0c4";
      c.fillRect(x, 128 - h, l, h);
      for (let fy = 128 - h + 5; fy < 124; fy += 8)
        for (let fx = x + 3; fx < x + l - 3; fx += 6) {
          if (nuit ? r() < 0.45 : r() < 0.15) {
            c.fillStyle = nuit ? "#ffd479" : "rgba(255,255,255,0.6)";
            c.fillRect(fx, fy, 3, 4);
          }
        }
      x += l + 2;
    }
    if (meteo === "pluie") {
      c.strokeStyle = "rgba(255,255,255,0.45)";
      for (let i = 0; i < 90; i++) {
        const px = r() * 256;
        const py = r() * 128;
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px - 3, py + 9);
        c.stroke();
      }
    }
    if (meteo === "neige") {
      c.fillStyle = "rgba(255,255,255,0.9)";
      for (let i = 0; i < 120; i++) {
        c.beginPath();
        c.arc(r() * 256, r() * 128, 1.2, 0, Math.PI * 2);
        c.fill();
      }
    }
  });
}
