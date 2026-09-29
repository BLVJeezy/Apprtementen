export type Apartment = {
  id: string;
  level: number;
  grossArea: number;
  netArea: number;
  bedrooms: number;
  bathrooms: number;
  terraceArea: number;
  description: string;
  availability: "Te bevestigen" | "Beschikbaar" | "In optie" | "Verkocht";
  price: number | null;
  plan: string;
  source: string;
};
export type Content = {
  brand: string;
  salesEmail: string | null;
  salesPhone: string | null;
  legal: string;
  apartments: Apartment[];
};
