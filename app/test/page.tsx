"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Test() {

  useEffect(() => {

    async function test() {

      const { data, error } = await supabase.auth.getSession();

      console.log("DATA :", data);
      console.log("ERROR :", error);

    }

    test();

  }, []);

  return (

    <main className="min-h-screen flex items-center justify-center">

      <h1 className="text-4xl font-bold">

        Connexion Supabase OK

      </h1>

    </main>

  );

}