"use client";

import { Plus, Trash2 } from "lucide-react";
import { Control, useFieldArray, UseFormRegister } from "react-hook-form";
import { ArrivageForm } from "@/lib/validators";

interface Props {
  control: Control<ArrivageForm>;
  register: UseFormRegister<ArrivageForm>;
  destinations: any[];
}

export default function DestinationList({
  control,
  register,
  destinations,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "destinations",
  });

  return (
    <div className="bg-white rounded-3xl p-8 shadow">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-2xl font-bold">
          Destinations
        </h2>

        <button
          type="button"
          onClick={() =>
            append({
              destination_id: 1,
              nb_palettes: 1,
            })
          }
          className="flex items-center gap-2 rounded-xl bg-[#78BE20] px-4 py-2 text-white"
        >
          <Plus size={18} />
          Ajouter
        </button>

      </div>

      <div className="space-y-4">

        {fields.map((field, index) => (

          <div
            key={field.id}
            className="grid grid-cols-12 gap-4 items-center"
          >

            <div className="col-span-7">

              <select
                {...register(
                  `destinations.${index}.destination_id`,
                  { valueAsNumber: true }
                )}
                className="w-full rounded-xl border p-3"
              >

                {destinations.map((destination) => (

                  <option
                    key={destination.id}
                    value={destination.id}
                  >
                    {destination.code}
                  </option>

                ))}

              </select>

            </div>

            <div className="col-span-3">

              <input
                type="number"
                min={1}
                {...register(
                  `destinations.${index}.nb_palettes`,
                  { valueAsNumber: true }
                )}
                className="w-full rounded-xl border p-3"
              />

            </div>

            <div className="col-span-2">

              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-xl bg-red-500 p-3 text-white"
              >
                <Trash2 size={18} />
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}