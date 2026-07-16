"use client";

import { useParams } from "next/navigation";
import PreparationArrivagePage from "../../preparation/page";

export default function ModifierArrivagePage() {
  const params = useParams();

  return (
    <PreparationArrivagePage
      mode="edit"
      arrivageId={params.id as string}
    />
  );
}