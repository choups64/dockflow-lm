"use client";

import { Trash2, Plus } from "lucide-react";

export interface EditableLine {
  referenceLM: string;
  designation: string;
  quantite: number;
}

interface EditableTableProps {
  lignes: EditableLine[];
  onChange: (lignes: EditableLine[]) => void;
}

export default function EditableTable({
  lignes,
  onChange,
}: EditableTableProps) {
  function updateLine(
    index: number,
    field: keyof EditableLine,
    value: string
  ) {
    const copy = [...lignes];

    copy[index] = {
      ...copy[index],
      [field]:
        field === "quantite"
          ? Number(value)
          : value,
    };

    onChange(copy);
  }

  function deleteLine(index: number) {
    const copy = [...lignes];
    copy.splice(index, 1);
    onChange(copy);
  }

  function addLine() {
    onChange([
      ...lignes,
      {
        referenceLM: "",
        designation: "",
        quantite: 1,
      },
    ]);
  }

  return (
    <div className="space-y-4">

      <table className="w-full rounded-xl overflow-hidden border">

        <thead className="bg-slate-200">

          <tr>

            <th className="p-3 text-left">
              Référence
            </th>

            <th className="p-3 text-left">
              Désignation
            </th>

            <th className="p-3 text-center w-32">
              Qté
            </th>

            <th className="w-16"></th>

          </tr>

        </thead>

        <tbody>

          {lignes.map((ligne, index) => (

            <tr
              key={index}
              className="border-t"
            >

              <td className="p-2">

                <input
                  className="w-full rounded border px-2 py-1"
                  value={ligne.referenceLM}
                  onChange={(e) =>
                    updateLine(
                      index,
                      "referenceLM",
                      e.target.value
                    )
                  }
                />

              </td>

              <td className="p-2">

                <input
                  className="w-full rounded border px-2 py-1"
                  value={ligne.designation}
                  onChange={(e) =>
                    updateLine(
                      index,
                      "designation",
                      e.target.value
                    )
                  }
                />

              </td>

              <td className="p-2">

                <input
                  type="number"
                  className="w-full rounded border px-2 py-1 text-center"
                  value={ligne.quantite}
                  onChange={(e) =>
                    updateLine(
                      index,
                      "quantite",
                      e.target.value
                    )
                  }
                />

              </td>

              <td className="text-center">

                <button
                  onClick={() =>
                    deleteLine(index)
                  }
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <button
        onClick={addLine}
        className="flex items-center gap-2 rounded-lg bg-[#78BE20] px-4 py-2 text-white font-semibold hover:bg-[#63a71b]"
      >
        <Plus size={18} />

        Ajouter une référence

      </button>

    </div>
  );
}