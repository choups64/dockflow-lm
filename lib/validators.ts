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
      reference_lm: z
        .string()
        .trim()
        .regex(/^\d{8}$/, "La référence LM doit contenir exactement 8 chiffres."),
      destination_id: z.number().min(1, "Veuillez sélectionner une destination."),
      nb_palettes: z.number().min(1, "Le nombre de palettes doit être supérieur à zéro."),
    })
  ),
});

export type ArrivageForm = z.infer<typeof arrivageSchema>;
