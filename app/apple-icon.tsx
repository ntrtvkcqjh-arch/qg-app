import { ImageResponse } from "next/og";
import { monogramme } from "./icon";

// Icône de l'écran d'accueil iPhone.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(monogramme(size.width), size);
}
