import type { MetadataRoute } from "next";

// Rend le QG installable sur l'écran d'accueil de l'iPhone (Partager → Sur l'écran d'accueil).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Le QG",
    short_name: "QG",
    description: "Le QG de Marjana",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBFAF7",
    theme_color: "#FBFAF7",
    lang: "fr",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
