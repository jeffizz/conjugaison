import { createFileRoute } from "@tanstack/react-router";
import { Conjugator } from "@/components/conjugator";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Conjugator />;
}
