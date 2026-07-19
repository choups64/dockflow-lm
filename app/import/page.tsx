"use client";

import { readImage } from "@/lib/ocr";
import { BackoParser } from "@/services/backoParser";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, ImagePlus, Search } from "lucide-react";
import { toast } from "sonner";
import EditableTable from "@/components/import/EditableTable";
import RRPageHeader from "@/components/dashboard/RRPageHeader";
import RRPageLayout from "@/components/dashboard/RRPageLayout";

import type { BackoResult } from "@/lib/backo/parser";

export default function ImportBacko() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BackoResult | null>(null);
  const [lignes, setLignes] = useState<BackoResult["lignes"]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  function loadFile(file: File) {
    const reader = new FileReader();

    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };

    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();

    if (e.dataTransfer.files.length > 0) {
      loadFile(e.dataTransfer.files[0]);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;

    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image")) {
        const file = item.getAsFile();

        if (file) {
          loadFile(file);
        }
      }
    }
  }

  useEffect(() => {
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

 async function analyser() {
  if (!image) return;

  try {
    setLoading(true);

    toast.info("Analyse OCR en cours...");

    const texte = await readImage(image);

    console.clear();

    console.log("===== TEXTE OCR =====");
    console.log(texte);

    const data = BackoParser.parse(texte);

    console.log(data);

    setResult(data);
    setLignes(data.lignes);

    toast.success(
      `${data.lignes.length} référence(s) détectée(s)`
    );

  } catch (e) {
    console.error(e);

    toast.error("Erreur OCR");

  } finally {
    setLoading(false);
  }
}
function continuer() {
  if (!result) return;

  const commande = {
    ...result,
    lignes,
  };

  localStorage.setItem(
    "commandeBacko",
    JSON.stringify(commande)
  );

  router.push("/dashboard/arrivages/preparation");
}
  return (
    <RRPageLayout>
      <div className="mx-auto max-w-6xl">
        <RRPageHeader
          title="Import BACKO"
          description="Importez une capture de commande pour préparer rapidement son arrivage."
        />

        <section className="rounded-3xl border border-[#E3E8EC] bg-white p-5 shadow-sm sm:p-8">

          <p className="text-[#66727A]">
            Faites une capture BACKO avec
            <strong> Windows + Shift + S</strong>,
            puis collez-la avec
            <strong> Ctrl + V</strong>
            ou déposez directement une image.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="mt-8 flex h-[360px] cursor-pointer items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#C8D1D8] bg-[#F6F8FA] transition hover:border-[#78BE20] sm:h-[420px]"
          >
            {image ? (
              <img
                src={image}
                alt="Capture BACKO"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center">

                <ImagePlus
                  size={70}
                  className="mx-auto rounded-2xl bg-[#EEF7E5] p-4 text-[#4F8F12]"
                />

                <h2 className="text-2xl font-black mt-6 text-[#101820]">
                  Déposez votre capture BACKO
                </h2>

                <p className="text-[#66727A] mt-3">
                  ou cliquez pour sélectionner une image
                </p>

                <div className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#EEF7E5] px-5 py-3 font-semibold text-[#4F8F12]">

                  <ClipboardPaste size={22} />

                  Ctrl + V

                </div>

              </div>
            )}
          </div>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.length) {
                loadFile(e.target.files[0]);
              }
            }}
          />

          <button
            onClick={analyser}
            disabled={!image || loading}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#78BE20] px-6 py-3 font-bold text-white transition hover:bg-[#4F8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/30 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <Search size={22} />

            {loading
              ? "Analyse en cours..."
              : "Analyser la capture"}
          </button>

          {result && (

            <div className="mt-10 rounded-2xl border border-[#E3E8EC] bg-[#F6F8FA] p-5 sm:p-6">

              <h2 className="text-2xl font-black mb-6 text-[#101820]">
                Analyse BACKO
              </h2>

              <div className="grid md:grid-cols-3 gap-8 mb-8">

  <div>
    <p className="font-bold">
      Commande
    </p>

    <p>
      {result.commande}
    </p>
  </div>

  <div>
    <p className="font-bold">
      Date de livraison
    </p>

    <p>
      {result.dateLivraison ?? "-"}
    </p>
  </div>

  <div>
    <p className="font-bold">
      Fournisseur
    </p>

    <p>
      {result.fournisseur ?? "-"}
    </p>
  </div>

</div>

              <h3 className="text-xl font-bold mb-4">
  Références détectées ({lignes.length})
</h3>

<EditableTable
  lignes={lignes}
  onChange={setLignes}
/>

<div className="mt-6 flex justify-end">
  <button
  onClick={continuer}
  className="min-h-12 w-full rounded-xl bg-[#78BE20] px-6 py-3 font-bold text-white transition hover:bg-[#4F8F12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#78BE20]/30 sm:w-auto"
>
  Continuer →
</button>
</div>

            </div>

          )}

        </section>

      </div>
    </RRPageLayout>
  );
}
