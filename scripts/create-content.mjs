import fs from "node:fs";
const source = JSON.parse(
  fs.readFileSync("analysis/apartment-schedule.json", "utf8"),
);
const manifest = JSON.parse(
  fs.readFileSync("public/assets/manifest.json", "utf8"),
);
// Explicit regeneration overwrites commercial edits; use only when re-importing verified architecture.
const content = {
  brand: "Solyn",
  salesEmail: null,
  salesPhone: null,
  legal:
    "Voorlopige projectpresentatie. Prijzen, beschikbaarheid, verkoopcontact en wettelijke verkoopinformatie worden nog aangevuld. Beelden zijn architectuurtekeningen, geen fotografie.",
  apartments: source.units.map((a) => ({
    id: a.id,
    level: a.floor,
    grossArea: a.grossAreaM2,
    netArea: a.netAreaM2,
    bedrooms: a.bedrooms,
    bathrooms: a.bathrooms,
    terraceArea: a.terraceAreaM2,
    description: `Een appartement met ${a.bedrooms} slaapkamers, een leefruimte met keuken, een badkamer en een apart toilet. ${a.floor === 2 ? "Twee terrassen van elk 20,37 m² sluiten aan op de woning." : "Een " + (a.coveredTerrace ? "overdekt " : "") + "terras biedt ruimte buiten."} Bekijk de indeling en de voorgestelde inrichting op het architectuurplan.`,
    availability: "Te bevestigen",
    price: null,
    plan: `/assets/apartment-${a.id}.webp`,
    source: `Architectuurplan · niveau ${a.floor}`,
  })),
};
fs.writeFileSync(
  "public/content.json",
  JSON.stringify(content, null, 2) + "\n",
);
fs.writeFileSync(
  "src/plan-pins.json",
  JSON.stringify(
    Object.fromEntries(
      manifest.assets
        .filter((a) => a.unitLabelPins.length)
        .map((a) => [a.id, a.unitLabelPins]),
    ),
    null,
    2,
  ) + "\n",
);
