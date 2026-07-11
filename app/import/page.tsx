export default function ImportBacko() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center">

      <div className="bg-white rounded-2xl shadow-xl p-10 w-[700px]">

        <h1 className="text-3xl font-bold text-green-700">
          📄 Importer une commande BACKO
        </h1>

        <p className="text-gray-500 mt-3">
          Cette fonctionnalité permettra d'importer une capture d'écran BACKO afin de pré-remplir automatiquement les informations de la commande.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-xl h-64 mt-8 flex items-center justify-center">

          <p className="text-gray-400 text-lg">
            Déposez ici votre capture d'écran
          </p>

        </div>

      </div>

    </main>
  );
}