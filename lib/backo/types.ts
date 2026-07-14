export interface BackoLine {
  referenceLM: string;
  designation: string;
  quantite: number;
}

export interface BackoDocument {
  commande: string;
  fournisseur: string;
  dateLivraison: string;
  lignes: BackoLine[];
}