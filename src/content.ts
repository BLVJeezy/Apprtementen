import type { Content, Apartment } from "./types";
const ids = [
  "0.1",
  "0.2",
  "0.3",
  "0.4",
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "2.1",
  "2.2",
];
export function parseContent(value: unknown): Content {
  const data = value as Content;
  if (
    !data ||
    typeof data.brand !== "string" ||
    typeof data.legal !== "string" ||
    !Array.isArray(data.apartments) ||
    data.apartments.length !== 10
  )
    throw new Error("Invalid project content");
  for (const field of ["salesEmail", "salesPhone"] as const)
    if (data[field] !== null && typeof data[field] !== "string")
      throw new Error("Invalid contact");
  if (
    data.salesEmail &&
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.salesEmail)
  )
    throw new Error("Invalid sales email");
  if (new Set(data.apartments.map((a) => a.id)).size !== 10)
    throw new Error("Duplicate apartments");
  for (const a of data.apartments) {
    if (!ids.includes(a.id) || a.level !== Number(a.id[0]))
      throw new Error("Invalid apartment");
    for (const key of [
      "grossArea",
      "netArea",
      "bedrooms",
      "bathrooms",
      "terraceArea",
    ] as const)
      if (typeof a[key] !== "number" || !Number.isFinite(a[key]) || a[key] <= 0)
        throw new Error("Invalid area or room count");
    for (const key of ["description", "source", "plan"] as const)
      if (typeof a[key] !== "string" || !a[key].trim())
        throw new Error("Missing apartment information");
    if (!a.plan.startsWith("/assets/") || a.plan.includes(".."))
      throw new Error("Invalid plan path");
    if (
      !(
        [
          "Te bevestigen",
          "Beschikbaar",
          "In optie",
          "Verkocht",
        ] as Apartment["availability"][]
      ).includes(a.availability)
    )
      throw new Error("Invalid availability");
    if (
      a.price !== null &&
      (typeof a.price !== "number" || !Number.isFinite(a.price) || a.price <= 0)
    )
      throw new Error("Invalid price");
  }
  return data;
}
