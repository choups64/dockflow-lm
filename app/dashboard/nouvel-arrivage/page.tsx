import ArrivalForm from "@/components/arrivages/ArrivalForm";
import RRPageHeader from "@/components/dashboard/RRPageHeader";
import RRPageLayout from "@/components/dashboard/RRPageLayout";

export default function Page() {
  return (
    <RRPageLayout>
      <div className="mx-auto max-w-5xl">
        <RRPageHeader
          title="Nouvel arrivage"
          description="Enregistrez une commande et répartissez ses palettes vers les bonnes destinations."
        />
        <ArrivalForm />
      </div>
    </RRPageLayout>
  );
}
