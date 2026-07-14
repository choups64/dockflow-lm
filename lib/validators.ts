import { z } from "zod";

export const arrivageSchema = z.object({
  numero_commande: z
    .string()
    .min(1, "Commande obligatoire"),

  date_mise_en_magasin: z
    .string(),

  commentaire: z
    .string()
    .optional(),

  rayon_id: z
    .number(),

  destinations: z.array(
    z.object({
      destination_id: z.number(),
      nb_palettes: z.number().min(1),
    })
  ),
});

export type ArrivageForm = z.infer<typeof arrivageSchema>;