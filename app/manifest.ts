import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DockFlow LM",
    short_name: "DockFlow",
    description: "Gestion des arrivages DockFlow",
    start_url: "/",
    display: "standalone",
    background_color: "#081018",
    theme_color: "#78BE20",
    icons: [
      {
        src: "/dockflow-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/dockflow-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
