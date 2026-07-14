export interface BackoZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const BACKO_ZONES = {

  commande: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },

  fournisseur: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },

  dateLivraison: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },

  tableau: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },

} satisfies Record<string, BackoZone>;