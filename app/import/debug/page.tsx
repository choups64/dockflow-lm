"use client";

import { useRef, useState } from "react";

export default function DebugBacko() {
  const [image, setImage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  function loadFile(file: File) {
    const reader = new FileReader();

    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };

    reader.readAsDataURL(file);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          Debug BACKO
        </h1>

        <button
          onClick={() => inputRef.current?.click()}
          className="bg-[#78BE20] text-white rounded-xl px-6 py-3"
        >
          Charger une capture
        </button>

        <input
          hidden
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.length) {
              loadFile(e.target.files[0]);
            }
          }}
        />

        {image && (

          <div className="mt-10">

            <div className="relative inline-block border shadow">

              <img
                src={image}
                alt=""
              />

              {/* Références */}

              <div
                className="absolute border-4 border-red-500"
                style={{
                  left: "3%",
                  top: "40.5%",
                  width: "11%",
                  height: "39%",
                }}
              />

              {/* Désignation */}

              <div
                className="absolute border-4 border-green-500"
                style={{
                  left: "14.5%",
                  top: "40.5%",
                  width: "34%",
                  height: "39%",
                }}
              />

              {/* Quantité */}

              <div
                className="absolute border-4 border-blue-500"
                style={{
                  left: "40.5%",
                  top: "40.5%",
                  width: "10%",
                  height: "39%",
                }}
              />

            </div>

          </div>

        )}

      </div>

    </main>
  );
}