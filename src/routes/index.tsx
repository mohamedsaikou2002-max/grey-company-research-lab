import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/occult-killer" });
  },
  head: () => ({
    meta: [
      { title: "Grey Company | Research Lab" },
      { name: "description", content: "Monochrome research lab: synthetic swarm simulator, NeuroAtlas workspace and grounded AI research chat." },
      { property: "og:title", content: "Grey Company | Research Lab" },
      { property: "og:description", content: "Synthetic swarm simulator, NeuroAtlas workspace and grounded AI research chat." },
    ],
  }),
});
