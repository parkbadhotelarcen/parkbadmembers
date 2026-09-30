import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Parkhotel Bad Arcen Members",
    short_name: "PBA Members",
    description: "Jouw verblijf. Jouw voordelen.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f5f6",
    theme_color: "#123047",
    lang: "nl",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
