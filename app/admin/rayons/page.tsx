import AdminTablePage from "@/components/admin/AdminTablePage";
export default function Page() { return <AdminTablePage title="Rayons" description="Rayons disponibles, filtrés selon le périmètre administrateur." table="rayons" columns={["code", "nom", "magasin_id", "actif"]} />; }
