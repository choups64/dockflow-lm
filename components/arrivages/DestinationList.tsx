"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  Control,
  FieldErrors,
  useFieldArray,
  UseFormRegister,
} from "react-hook-form";
import { ArrivageForm } from "@/lib/validators";

type Destination = {
  id: number;
  code: string;
};

interface Props {
  control: Control<ArrivageForm>;
  register: UseFormRegister<ArrivageForm>;
  errors: FieldErrors<ArrivageForm>;
  destinations: Destination[];
}

export default function DestinationList({
  control,
  register,
  errors,
  destinations,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "destinations",
  });

  return (
    <div className="rounded-3xl bg-white p-8 shadow">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Destinations</h2>

        <button
          type="button"
          onClick={() =>
            append({
              reference_lm: "",
              destination_id: 0,
              nb_palettes: 1,
            })
          }
          className="flex items-center gap-2 rounded-xl bg-[#78BE20] px-4 py-2 text-white"
        >
          <Plus size={18} aria-hidden="true" />
          Ajouter
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 items-start gap-4 md:grid-cols-12"
          >
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-semibold" htmlFor={`reference-lm-${field.id}`}>
                Référence LM
              </label>
              <input
                id={`reference-lm-${field.id}`}
                inputMode="numeric"
                maxLength={8}
                {...register(`destinations.${index}.reference_lm`, {
                  onChange: (event) => {
                    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 8);
                  },
                })}
                className="w-full rounded-xl border border-slate-300 p-3"
                placeholder="87007999"
              />
              {errors.destinations?.[index]?.reference_lm && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.destinations[index].reference_lm.message}
                </p>
              )}
            </div>

            <div className="md:col-span-5">
              <label className="mb-1 block text-sm font-semibold" htmlFor={`destination-${field.id}`}>
                Destination
              </label>
              <select
                id={`destination-${field.id}`}
                {...register(`destinations.${index}.destination_id`, {
                  valueAsNumber: true,
                })}
                className="w-full rounded-xl border border-slate-300 p-3"
              >
                <option value="">Choisir une destination...</option>
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.code}
                  </option>
                ))}
              </select>
              {errors.destinations?.[index]?.destination_id && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.destinations[index].destination_id.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold" htmlFor={`palettes-${field.id}`}>
                Palettes
              </label>
              <input
                id={`palettes-${field.id}`}
                type="number"
                min={1}
                {...register(`destinations.${index}.nb_palettes`, {
                  valueAsNumber: true,
                })}
                className="w-full rounded-xl border border-slate-300 p-3"
              />
              {errors.destinations?.[index]?.nb_palettes && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.destinations[index].nb_palettes.message}
                </p>
              )}
            </div>

            <div className="flex pt-6 md:col-span-2">
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-xl bg-red-500 p-3 text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Supprimer cette destination"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
