import { ImageResponse } from "next/og";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";
// Temporary typographic app icon; deliberately not a recreation of the brand logo.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#123047",
        color: "#6cd9ce",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 75,
        letterSpacing: 4,
      }}
    >
      PBA
    </div>,
    size,
  );
}
