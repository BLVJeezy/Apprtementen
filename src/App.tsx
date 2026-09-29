import React, { useEffect, useState, lazy, Suspense } from "react";
import {
  ArrowUpRight,
  BedDouble,
  Layers,
  Maximize2,
  X,
  ChevronDown,
  MapPin,
  Check,
} from "lucide-react";
import type { Apartment, Content } from "./types";
import { parseContent } from "./content";
import Enquiry from "./Enquiry";
import pins from "./plan-pins.json";
import "./styles.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import { PlanViewer, SafeImage } from "./PlanViewer";
const motion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches
    ? ("instant" as const)
    : ("smooth" as const);
const HeroScene = lazy(() => import("./three/HeroScene"));
const Experience = lazy(() => import("./three/Experience"));
const levelNames = ["Gelijkvloers", "Eerste verdieping", "Tweede verdieping"];
const plans = ["plan-ground", "plan-first", "plan-second"];
const number = (n: number) =>
  n.toLocaleString("nl-BE", { maximumFractionDigits: 2 });
function App({ content }: { content: Content }) {
  const initial = location.hash.match(/^#woning-(\d\.\d)$/)?.[1];
  const [selected, setSelected] = useState<Apartment>(
    content.apartments.find((a) => a.id === initial) || content.apartments[0],
  );
  const [level, setLevel] = useState(selected.level);
  const [mode, setMode] = useState<"exterior" | "interior">("exterior");
  const [face, setFace] = useState("front");
  const [expanded, setExpanded] = useState(false);
  const [experience, setExperience] = useState(false);
  const closeExperience = () => {
    setExperience(false);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>(".hero-enter")
        ?.focus({ preventScroll: true }),
    );
  };
  useEffect(() => {
    if (initial)
      requestAnimationFrame(() =>
        document
          .getElementById("woning")
          ?.scrollIntoView({ behavior: "instant" }),
      );
  }, []);
  useEffect(() => {
    const fn = () => {
      const id = location.hash.match(/^#woning-(\d\.\d)$/)?.[1];
      const a = content.apartments.find((a) => a.id === id);
      if (a) {
        setSelected(a);
        setLevel(a.level);
      }
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, [content]);
  useEffect(() => {
    if (!expanded) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      document
        .querySelector<HTMLButtonElement>(
          '[aria-label="Vergroot het appartementplan"]',
        )
        ?.focus({ preventScroll: true });
    };
  }, [expanded]);
  const choose = (a: Apartment, scroll = true) => {
    setSelected(a);
    setLevel(a.level);
    history.pushState(null, "", `#woning-${a.id}`);
    if (scroll)
      requestAnimationFrame(() =>
        document
          .getElementById("woning")
          ?.scrollIntoView({ behavior: motion(), block: "start" }),
      );
  };
  const changeLevel = (n: number) => {
    setLevel(n);
    const next = content.apartments.find((a) => a.level === n)!;
    setSelected(next);
    history.replaceState(null, "", `#woning-${next.id}`);
  };
  const levelApartments = content.apartments.filter((a) => a.level === level);
  const enquiry = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: motion() });
    document
      .querySelector<HTMLInputElement>('input[name="name"]')
      ?.focus({ preventScroll: true });
  };
  return (
    <>
      <a className="skip-link" href="#ontdek">
        Naar de woningen
      </a>
      <header className="header">
        <a
          href="#"
          className="brand"
          aria-label={`${content.brand} startpagina`}
        >
          {content.brand}
          <span>RESIDENCES · HEERS</span>
        </a>
        <nav aria-label="Hoofdnavigatie">
          <a href="#architectuur">Architectuur</a>
          <a href="#ontdek">De appartementen</a>
          <a href="#contact" className="nav-contact">
            Contact <ArrowUpRight size={15} />
          </a>
        </nav>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-top">
            <div>
              <p className="eyebrow">
                <span /> STEENWEG, HEERS
              </p>
              <h1 id="hero-title">
                Ruimte om
                <br />
                thuis te <em>komen.</em>
              </h1>
            </div>
            <div className="hero-intro">
              <p>
                Tien appartementen.
                <br />
                Een eigen plek, met buitenruimte.
              </p>
              <a className="button" href="#ontdek">
                Ontdek uw appartement <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
          <div className="hero-visual spatial-hero">
            <Suspense
              fallback={
                <SafeImage
                  className="scene-fallback"
                  src="/assets/elevation-front.webp"
                  alt="Voorgevel van het gebouw"
                  fetchPriority="high"
                />
              }
            >
              <HeroScene paused={experience} />
            </Suspense>
            <span className="hero-scene-hint">
              Sleep om te draaien · knijp om te zoomen
            </span>
            <button
              className="button hero-enter"
              onClick={() => setExperience(true)}
            >
              Enter the apartment <ArrowUpRight size={18} />
            </button>
            <div className="drawing-label">
              01 / ONTDEK HET GEBOUW{" "}
              <span>3D-planmodel · landschap indicatief</span>
            </div>
          </div>
          <div className="hero-bottom">
            <span>10 APPARTEMENTEN</span>
            <span>2–3 SLAAPKAMERS</span>
            <span>3 WOONNIVEAUS</span>
            <a href="#architectuur" aria-label="Meer over de architectuur">
              <ChevronDown size={21} />
            </a>
          </div>
        </section>
        <section className="intro section" id="architectuur">
          <p className="eyebrow">01 — EEN HELDERE ARCHITECTUUR</p>
          <div className="intro-grid">
            <h2>
              Een ritme van licht.
              <br />
              Een plek voor <em>rust.</em>
            </h2>
            <div>
              <p>
                Een lichte gevelsteen, donkere raamprofielen en glazen
                balustrades. De architectuur brengt een helder lijnenspel samen
                met private terrassen.
              </p>
              <p className="muted">
                Van het gelijkvloers tot de terugliggende bovenste verdieping:
                ontdek elke woning aan de hand van de originele, gemeubileerde
                architectuurplannen.
              </p>
              <span className="fine">
                Projectnaam en verkooptekst zijn voorlopig.
              </span>
            </div>
          </div>
        </section>
        <section className="explore section" id="ontdek">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 — VIND UW PLEK</p>
              <h2>
                Wonen op <em>uw niveau.</em>
              </h2>
            </div>
            <p>
              Kies een verdieping.
              <br />
              Ontdek de woning die bij u past.
            </p>
          </div>
          <div className="explorer-shell">
            <div className="explorer-toolbar">
              <div className="segmented" aria-label="Weergave">
                <button
                  aria-pressed={mode === "exterior"}
                  onClick={() => setMode("exterior")}
                >
                  Exterieur
                </button>
                <button
                  aria-pressed={mode === "interior"}
                  onClick={() => setMode("interior")}
                >
                  Interieur & plan
                </button>
              </div>
              <span className="view-note">
                {mode === "exterior"
                  ? "Architectuur in vier aanzichten"
                  : "Gemeubileerd plan · architect"}
              </span>
            </div>
            <div className="explorer-body">
              <div className="level-rail">
                <span className="rail-label">NIVEAU</span>
                {[2, 1, 0].map((n) => (
                  <button
                    key={n}
                    aria-label={`Niveau ${n}: ${levelNames[n]}`}
                    aria-pressed={level === n}
                    onClick={() => changeLevel(n)}
                  >
                    <span>0{n}</span>
                    <small>{n === 2 ? "2 woningen" : "4 woningen"}</small>
                  </button>
                ))}
              </div>
              <div className="building-view">
                {mode === "exterior" ? (
                  <>
                    <PlanViewer
                      src={`/assets/elevation-${face}.webp`}
                      alt={`${({ front: "Voorgevel", rear: "Achtergevel", left: "Linker zijgevel", right: "Rechter zijgevel" } as Record<string, string>)[face]} van het gebouw`}
                    />
                    <div className="face-controls">
                      {[
                        ["front", "Voorgevel"],
                        ["rear", "Achtergevel"],
                        ["left", "Links"],
                        ["right", "Rechts"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          aria-pressed={face === value}
                          onClick={() => setFace(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <PlanViewer
                    src={`/assets/${plans[level]}.webp`}
                    alt={`Gemeubileerd overzicht ${levelNames[level]}`}
                  >
                    <div className={`plan-markers level-${level}`}>
                      {levelApartments.map((a) => (
                        <button
                          key={a.id}
                          style={{
                            left: `${(pins[plans[level] as keyof typeof pins].find((p) => p.unit === a.id)?.x ?? 0.5) * 100}%`,
                            top: `${(pins[plans[level] as keyof typeof pins].find((p) => p.unit === a.id)?.y ?? 0.5) * 100}%`,
                          }}
                          aria-label={`Bekijk appartement ${a.id}`}
                          aria-pressed={selected.id === a.id}
                          onClick={() => choose(a)}
                        >
                          {a.id}
                        </button>
                      ))}
                    </div>
                  </PlanViewer>
                )}
                <p className="visual-caption">
                  {mode === "exterior"
                    ? "Gevels volgens het ontwerp van 24 juli 2026."
                    : "Inrichting zoals op het architectuurplan; meubilair is indicatief."}{" "}
                  <span>Originele architectuurtekeningen.</span>
                </p>
              </div>
            </div>
            <div className="level-summary">
              <div>
                <span className="eyebrow">NIVEAU 0{level}</span>
                <h3>{levelNames[level]}</h3>
              </div>
              <span>
                {levelApartments.length} appartementen{" "}
                <span className="availability-note">
                  · beschikbaarheid te bevestigen
                </span>
              </span>
            </div>
            <div className={`apartment-grid count-${levelApartments.length}`}>
              {levelApartments.map((a) => (
                <button
                  key={a.id}
                  className={`apartment-card ${selected.id === a.id ? "selected" : ""}`}
                  onClick={() => choose(a)}
                  aria-pressed={selected.id === a.id}
                >
                  <div className="card-top">
                    <span
                      className={`status ${a.availability === "Beschikbaar" ? "available" : ""}`}
                    >
                      {a.availability}
                    </span>
                    <ArrowUpRight size={19} />
                  </div>
                  <div className="card-number">
                    <span>Appartement</span>
                    <strong>{a.id}</strong>
                  </div>
                  <div className="card-facts">
                    <span>
                      {number(a.netArea)} m²<small>netto volgens plan</small>
                    </span>
                    <span>
                      <BedDouble size={17} />
                      {a.bedrooms}
                      <small>slaapkamers</small>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
        <section
          className="detail section"
          id="woning"
          aria-label={`Details appartement ${selected.id}`}
        >
          <div className="detail-heading">
            <div>
              <p className="eyebrow">03 — UW APPARTEMENT</p>
              <h2>
                Appartement <em>{selected.id}</em>
              </h2>
            </div>
            <span className="level-tag">
              <Layers size={16} />
              {levelNames[selected.level]}
            </span>
          </div>
          <div className="detail-grid">
            <div className="detail-plan">
              <div className="plan-title">
                <span>HET GEMEUBILEERDE PLAN</span>
                <button
                  onClick={() => {
                    setExpanded(true);
                    requestAnimationFrame(() =>
                      document
                        .querySelector<HTMLDialogElement>("dialog")
                        ?.showModal(),
                    );
                  }}
                  aria-label="Vergroot het appartementplan"
                >
                  <Maximize2 size={17} />
                  Vergroten
                </button>
              </div>
              <PlanViewer
                src={selected.plan}
                alt={`Gemeubileerd architectuurplan appartement ${selected.id}`}
              />
              <p className="fine">
                {selected.source} · 24/07/2026
                <br />
                Detail uit het verdiepingsplan. Aanliggende of
                gemeenschappelijke ruimte kan zichtbaar zijn. Het woningnummer
                en de oorspronkelijke kleur duiden uw woning aan. Inrichting is
                indicatief.
              </p>
            </div>
            <div className="detail-copy">
              <p className="eyebrow">
                {selected.bedrooms} SLAAPKAMERS · PRIVÉTERRAS
              </p>
              <h3>
                Ruimte voor
                <br />
                het dagelijkse leven.
              </h3>
              <p>{selected.description}</p>
              <dl className="facts">
                <div>
                  <dt>Bruto-oppervlakte</dt>
                  <dd>{number(selected.grossArea)} m²</dd>
                </div>
                <div>
                  <dt>Netto-oppervlakte</dt>
                  <dd>{number(selected.netArea)} m²</dd>
                </div>
                <div>
                  <dt>Slaapkamers</dt>
                  <dd>{selected.bedrooms}</dd>
                </div>
                <div>
                  <dt>Badkamer</dt>
                  <dd>{selected.bathrooms} + apart toilet</dd>
                </div>
                <div>
                  <dt>Terras{selected.level === 2 ? "sen" : ""}</dt>
                  <dd>
                    {number(selected.terraceArea)} m²
                    {selected.level === 2 ? " (2 × 20,37)" : ""}
                  </dd>
                </div>
                <div>
                  <dt>Beschikbaarheid</dt>
                  <dd>{selected.availability}</dd>
                </div>
              </dl>
              <p className="area-note">
                Oppervlaktes overgenomen uit het architectuurplan. De
                netto-oppervlakte lijkt de terrasoppervlakte te omvatten. Laat
                de afzonderlijke binnenwoonoppervlakte door het verkoopteam
                bevestigen.
              </p>
              <div className="price-row">
                <span>Richtprijs</span>
                <strong>
                  {selected.price
                    ? new Intl.NumberFormat("nl-BE", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      }).format(selected.price)
                    : "Nog te bepalen"}
                </strong>
              </div>
              <button className="button" onClick={enquiry}>
                Interesse in appartement {selected.id}
                <ArrowUpRight size={18} />
              </button>
              <button
                className="button detail-enter"
                onClick={() => setExperience(true)}
              >
                Enter apartment {selected.id} · 3D
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
        </section>
        <section className="site-section section">
          <div>
            <p className="eyebrow">04 — HET GEHEEL</p>
            <h2>
              Meer dan
              <br />
              uw <em>voordeur.</em>
            </h2>
            <p>
              Het inplantingsplan toont de ligging van het gebouw, de toegang en
              de inrichting van het terrein.
            </p>
            <p className="muted">
              Ook de gemeenschappelijke circulatie, lift, terrassen en
              buitenaanleg maken deel uit van het ontwerp. Bekijk het terrein
              zoals het is gedocumenteerd.
            </p>
            <span className="location">
              <MapPin size={18} />
              Steenweg · 3870 Heers
            </span>
          </div>
          <div>
            <PlanViewer
              src="/assets/site-plan.webp"
              alt="Inplantingsplan met gebouw, toegang en gedocumenteerde buitenaanleg"
            />
            <p className="fine">
              Inplantingsplan architect · geen toewijzing van privétuinen of
              parkeerplaatsen.
            </p>
          </div>
        </section>
        <section className="contact-section section" id="contact">
          <div>
            <p className="eyebrow">05 — EEN VOLGENDE STAP</p>
            <h2>
              Uw nieuwe thuis
              <br />
              begint met een <em>gesprek.</em>
            </h2>
            <p>
              Stel uw vragen over appartement {selected.id}, de plannen of het
              verdere verloop.
            </p>
            {content.salesEmail ? (
              <a href={`mailto:${content.salesEmail}`}>{content.salesEmail}</a>
            ) : (
              <p className="contact-notice">
                De verkoopcontactgegevens volgen nog. U kunt uw aanvraag alvast
                voorbereiden en downloaden.
              </p>
            )}
            {content.salesPhone && (
              <a href={`tel:${content.salesPhone.replace(/[^+\d]/g, "")}`}>
                {content.salesPhone}
              </a>
            )}
            <div className="selected-enquiry">
              <Check size={18} />
              <span>
                Uw selectie <strong>Appartement {selected.id}</strong>
              </span>
              <a href="#ontdek">Wijzigen</a>
            </div>
          </div>
          <Enquiry apartment={selected.id} salesEmail={content.salesEmail} />
        </section>
      </main>
      <footer>
        <a href="#" className="brand">
          {content.brand}
          <span>RESIDENCES · HEERS</span>
        </a>
        <p>{content.legal}</p>
        <span>
          © {new Date().getFullYear()} {content.brand}
        </span>
      </footer>
      {experience && (
        <Suspense
          fallback={
            <div className="loading-tour" role="status">
              Rondleiding wordt geladen…
            </div>
          }
        >
          <Experience apartment={selected.id} onClose={closeExperience} />
        </Suspense>
      )}
      {expanded && (
        <dialog
          aria-label={`Plan appartement ${selected.id}`}
          onCancel={() => setExpanded(false)}
          onClose={() => setExpanded(false)}
        >
          <div className="dialog-header">
            <h3>Appartement {selected.id}</h3>
            <button
              autoFocus
              onClick={() => setExpanded(false)}
              aria-label="Sluiten"
            >
              <X />
            </button>
          </div>
          <PlanViewer
            src={selected.plan}
            alt={`Vergroot plan appartement ${selected.id}`}
          />
          <p className="fine">
            Gebruik + om details te bekijken. Escape sluit het plan.
          </p>
        </dialog>
      )}
    </>
  );
}
export default function Root() {
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setError(false);
    fetch("/content.json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        setContent(parseContent(data));
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    return () => abort.abort();
  }, [attempt]);
  if (error)
    return (
      <main className="loading">
        <h1>Even geduld.</h1>
        <p>De woninggegevens konden niet worden geladen.</p>
        <button className="button" onClick={() => setAttempt(attempt + 1)}>
          Opnieuw proberen
        </button>
      </main>
    );
  if (!content)
    return (
      <main className="loading" role="status">
        <span className="brand">Solyn</span>
        <p>De woningen worden geladen…</p>
      </main>
    );
  return <App content={content} />;
}
