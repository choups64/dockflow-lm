import { supabase } from "@/lib/supabase";

export type Destination = {
  id: number;
  code: string;
  nom: string;
  magasin_id: string | null;
  actif: boolean;
};

export async function getDestinations(options?: { arrivageId?: string }) {
  const { data: sessionData } = await supabase.auth.getSession();
  const params = new URLSearchParams();
  if (options?.arrivageId) params.set("arrivageId", options.arrivageId);

  const response = await fetch(`/api/rr/destinations${params.size ? `?${params}` : ""}`, {
    headers: { Authorization: `Bearer ${sessionData.session?.access_token ?? ""}` },
  });
  const result = (await response.json()) as { destinations?: Destination[]; error?: string };
  if (!response.ok) throw new Error(result.error ?? "Impossible de charger les destinations.");
  return result.destinations ?? [];
}

export function destinationValue(destination: Pick<Destination, "id">) {
  return String(destination.id);
}

export function resolveDestinationValue(value: string | null | undefined, destinations: Destination[]) {
  if (!value) return "";
  const destination = destinations.find((item) => String(item.id) === value || item.code === value);
  return destination ? destinationValue(destination) : value;
}
