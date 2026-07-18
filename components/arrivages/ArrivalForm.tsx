"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { arrivageSchema, ArrivageForm } from "@/lib/validators";
import { RayonsService } from "@/services/rayons";
import { DestinationsService } from "@/services/destinations";
import { ArrivagesService } from "@/services/arrivages";

import DestinationList from "./DestinationList";

type Rayon = {
  id: number;
  code: string;
  nom: string;
};

type Destination = {
  id: number;
  code: string;
};

export default function ArrivalForm() {
  const router = useRouter();

  const [rayons, setRayons] = useState<Rayon[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArrivageForm>({
    resolver: zodResolver(arrivageSchema),
    defaultValues: {
      numero_commande: "",
      date_mise_en_magasin: "",
      commentaire: "",
      rayon_id: 1,
      destinations: [
        {
          reference_lm: "",
          destination_id: 0,
          nb_palettes: 1,
        },
      ],
    },
  });

  useEffect(() => {
    async function chargerDonnees() {
      const { data: rayonsData } = await RayonsService.getAll();
      const { data: destinationsData } =
        await DestinationsService.getAll();

      if (rayonsData) {
        setRayons(rayonsData);
      }

      if (destinationsData) {
        setDestinations(destinationsData);
      }
    }

    chargerDonnees();
  }, []);

  async function onSubmit(data: ArrivageForm) {
    try {
      setLoading(true);

      await ArrivagesService.create(data);

      toast.success("Arrivage enregistré avec succès");

      router.push("/dashboard/arrivages");
    } catch (error) {
      console.error(error);

      toast.error("Impossible d'enregistrer l'arrivage");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
      <div className="bg-white rounded-3xl shadow p-8">

        <h2 className="text-2xl font-bold mb-6">
          Nouvel arrivage
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <label className="font-semibold">
              Commande BACKO
            </label>

            <input
              {...register("numero_commande")}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3"
              placeholder="458963"
            />

            {errors.numero_commande && (
              <p className="text-red-500 text-sm mt-1">
                {errors.numero_commande.message}
              </p>
            )}
          </div>

          <div>
            <label className="font-semibold">
              Date de réception prévisionnelle
            </label>

            <input
              type="date"
              {...register("date_mise_en_magasin")}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3"
            />
          </div>

          <div>
            <label className="font-semibold">
              Rayon
            </label>

            <select
              {...register("rayon_id", {
                valueAsNumber: true,
              })}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3"
            >
              {rayons.map((rayon) => (
                <option
                  key={rayon.id}
                  value={rayon.id}
                >
                  {rayon.code} - {rayon.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold">
              Commentaire produit
            </label>

            <input
              {...register("commentaire")}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3"
              placeholder="Ex : Salon de jardin"
            />
          </div>

        </div>

      </div>

      <DestinationList
        control={control}
        register={register}
        errors={errors}
        destinations={destinations}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-[#78BE20] hover:bg-[#5ea117] transition text-white font-bold rounded-2xl px-8 py-4 disabled:opacity-50"
      >
        {loading
          ? "Enregistrement..."
          : "Enregistrer l'arrivage"}
      </button>

    </form>
  );
}
