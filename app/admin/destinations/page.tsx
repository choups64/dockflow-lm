import AdminTablePage from "@/components/admin/AdminTablePage";
export default function Page() { return <AdminTablePage title="Destinations" description="Destinations disponibles, filtrées selon le périmètre administrateur." table="destinations" columns={["code", "nom", "magasin_id", "actif"]} />; }
