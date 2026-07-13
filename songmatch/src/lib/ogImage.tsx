import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbf7f1",
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #ff7a4f, #ec3f1a)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 18,
                height: 70,
                borderRadius: 9,
                background: "white",
              }}
            />
            <div
              style={{
                width: 18,
                height: 140,
                borderRadius: 9,
                background: "white",
              }}
            />
            <div
              style={{
                width: 18,
                height: 200,
                borderRadius: 9,
                background: "white",
              }}
            />
            <div
              style={{
                width: 18,
                height: 70,
                borderRadius: 9,
                background: "white",
              }}
            />
          </div>
        </div>
        <div
          style={{
            marginTop: 44,
            fontSize: 84,
            fontWeight: 700,
            color: "#211c18",
          }}
        >
          SongMatch
        </div>
        <div style={{ marginTop: 18, fontSize: 34, color: "#7d6b58" }}>
          Where lyrics find their voice.
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
