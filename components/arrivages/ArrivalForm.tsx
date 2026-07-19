"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { arrivageSchema, ArrivageForm } from "@/lib/validators";
import { DestinationsService } from "@/services/destinations";
import { ArrivagesService } from "@/services/arrivages";
import { ProfileService } from "@/services/profile";

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
  const [erreurRayons, setErreurRayons] = useState<string | null>(null);
  const [chargementRayons, setChargementRayons] = useState(true);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ArrivageForm>({
    resolver: zodResolver(arrivageSchema),
    defaultValues: {
      numero_commande: "",
      date_mise_en_magasin: "",
      commentaire: "",
      rayon_id: 0,
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
      try {
        const [rayonsData, destinationsResult] = await Promise.all([
          ProfileService.getCurrentUserRayons(),
          DestinationsService.getAll(),
        ]);
        setRayons(rayonsData);
        if (rayonsData.length === 1) setValue("rayon_id", rayonsData[0].id);
        if (rayonsData.length === 0) setErreurRayons("Aucun rayon n’est associé à votre profil. Contactez un administrateur.");
        if (destinationsResult.data) setDestinations(destinationsResult.data);
      } catch (error) {
        setErreurRayons(error instanceof Error ? error.message : "Aucun rayon n’est associé à votre profil. Contactez un administrateur.");
      } finally {
        setChargementRayons(false);
      }
    }

    chargerDonnees();
  }, [setValue]);

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
      {erreurRayons && <p className="rounded-xl bg-red-50 p-4 text-red-700">{erreurRayons}</p>}
      <fieldset disabled={chargementRayons || Boolean(erreurRayons)} className="space-y-8 disabled:opacity-60">
      <section className="rounded-3xl border border-[#E3E8EC] bg-white p-5 shadow-sm sm:p-8">

        <h2 className="text-2xl font-black text-[#101820] mb-6">
          Informations de l&apos;arrivage
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <label className="font-semibold text-[#101820]">
              Commande BACKO
            </label>

            <input
              {...register("numero_commande")}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#E3E8EC] px-4 py-3 text-[#101820] outline-none transition placeholder:text-[#66727A] focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15"
              placeholder="72539619"
            />

            {errors.numero_commande && (
              <p className="text-red-500 text-sm mt-1">
                {errors.numero_commande.message}
              </p>
            )}
          </div>

          <div>
            <label className="font-semibold text-[#101820]">
              Date de réception prévisionnelle
            </label>

            <input
              type="date"
              {...register("date_mise_en_magasin")}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#E3E8EC] px-4 py-3 text-[#101820] outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15"
            />
          </div>

          <div>
            <label className="font-semibold text-[#101820]">
              Rayon
            </label>

            <select
              {...register("rayon_id", {
                valueAsNumber: true,
              })}
              disabled={chargementRayons || rayons.length <= 1}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#E3E8EC] px-4 py-3 text-[#101820] outline-none transition focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15"
            >
              {rayons.length !== 1 && <option value="">Choisir un rayon...</option>}
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
            <label className="font-semibold text-[#101820]">
              Commentaire produit
            </label>

            <input
              {...register("commentaire")}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#E3E8EC] px-4 py-3 text-[#101820] outline-none transition placeholder:text-[#66727A] focus:border-[#78BE20] focus:ring-4 focus:ring-[#78BE20]/15"
              placeholder="Ex : Salon de jardin"
            />
          </div>

        </div>

      </section>

      <DestinationList
        control={control}
        register={register}
        errors={errors}
        destinations={destinations}
      />
      </fieldset>

      <button
        type="submit"
        disabled={loading || chargementRayons || Boolean(erreurRayons) || rayons.length === 0}
        className="min-h-12 w-full rounded-xl bg-[#78BE20] px-6 py-3 font-bold text-white transition hover:bg-[#4F8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading
          ? "Enregistrement..."
          : "Enregistrer l'arrivage"}
      </button>

    </form>
  );
}
