import AdminTablePage from "@/components/admin/AdminTablePage";
export default function Page() { return <AdminTablePage title="Arrivages" description="Consultation des arrivages de votre périmètre magasin." table="arrivages" columns={["commande", "fournisseur", "magasin_id", "rayon_id", "date_arrivee", "statut"]} />; }
