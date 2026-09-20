import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Parkbad Members",
    short_name: "Parkbad",
    description: "Jouw verblijf. Jouw voordelen.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#003e33",
    lang: "nl",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
