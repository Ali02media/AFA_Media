import { ImageResponse } from "next/og";

export const alt = "AFA Media — Marketing That Gets Your Phone Ringing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#05060a",
          padding: "64px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Ambient glow — blue left */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: -120,
            top: -120,
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(44,135,208,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />
        {/* Ambient glow — teal right */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: -80,
            bottom: -80,
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(25,176,161,0.25) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 44,
              height: 44,
              background: "linear-gradient(135deg, #2c87d0, #19b0a1)",
              borderRadius: 10,
            }}
          />
          <span style={{ color: "#ffffff", fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>
            AFA Media
          </span>
        </div>

        {/* Main headline block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 48 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#19b0a1", letterSpacing: "3px" }}>
            UK MARKETING AGENCY
          </span>
          <span
            style={{
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: "-1px",
              color: "#ffffff",
              maxWidth: 760,
            }}
          >
            Marketing that gets your phone ringing.
          </span>
          <span style={{ fontSize: 22, color: "#c4c8d8", lineHeight: 1.5, maxWidth: 680 }}>
            Websites · AI Chatbots · Email Marketing · Paid Ads — all under one roof.
          </span>
        </div>

        {/* Stats row — pushed to bottom */}
        <div style={{ display: "flex", gap: 48, marginTop: "auto" }}>
          {(
            [
              { v: "14", s: " days", l: "delivery guarantee" },
              { v: "4", s: " services", l: "one team, one plan" },
              { v: "24", s: "/7", l: "AI lead capture" },
            ] as const
          ).map((stat) => (
            <div key={stat.l} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}>{stat.v}</span>
                <span style={{ color: "#2dd4bf", fontSize: 22, fontWeight: 600 }}>{stat.s}</span>
              </div>
              <span style={{ color: "#6e7690", fontSize: 14 }}>{stat.l}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
