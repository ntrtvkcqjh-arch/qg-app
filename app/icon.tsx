import { ImageResponse } from "next/og";

// Icône du QG : monogramme serif sur fond crème, filet double (charte rapport-design).
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export function monogramme(px: number) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FBFAF7",
        color: "#121212",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ fontSize: px * 0.42, fontWeight: 700, lineHeight: 1 }}>QG</div>
      <div
        style={{
          width: px * 0.46,
          height: px * 0.035,
          marginTop: px * 0.04,
          borderTop: `${Math.max(2, px * 0.01)}px solid #1F3A5F`,
          borderBottom: `${Math.max(2, px * 0.01)}px solid #1F3A5F`,
        }}
      />
    </div>
  );
}

export default function Icon() {
  return new ImageResponse(monogramme(size.width), size);
}
