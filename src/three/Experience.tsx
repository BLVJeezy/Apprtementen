import { useState, useRef, useEffect } from "react";
import {
  X,
  Maximize,
  Minimize,
  Plus,
  Minus,
  RotateCcw,
  Move,
  Footprints,
  Layers,
} from "lucide-react";
import Joystick from "./Joystick";
import SceneCanvas from "./SceneCanvas";
import type { SceneMode, SceneCommand } from "./types";
export default function Experience({
  apartment,
  onClose,
}: {
  apartment: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [level, setLevel] = useState(Number(apartment[0]));
  const [unit, setUnit] = useState(apartment);
  const [mode, setMode] = useState<SceneMode>("walk");
  const [command, setCommand] = useState<{
    id: number;
    action: SceneCommand;
  }>();
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(
    Boolean(document.fullscreenElement),
  );
  const [screenMessage, setScreenMessage] = useState("");
  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setScreenMessage("");
    } catch {
      setScreenMessage(
        "Volledig scherm is niet beschikbaar in deze browser. De grote rondleiding blijft bruikbaar.",
      );
    }
  };
  const closeTour = () => {
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
    onClose();
  };
  const [movement, setMovement] = useState({ x: 0, y: 0 });
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    setMovement({ x: 0, y: 0 });
  }, [mode, level, unit]);
  const send = (action: SceneCommand) =>
    setCommand((c) => ({ id: (c?.id || 0) + 1, action }));
  const chooseLevel = (n: number) => {
    setLevel(n);
    setUnit(`${n}.1`);
  };
  return (
    <dialog
      className="experience"
      ref={dialog}
      aria-label="Interactieve 3D rondleiding"
      onCancel={closeTour}
      onClose={closeTour}
    >
      <div className="experience-top">
        <div>
          <span className="eyebrow">SOLYN · LIVE 3D</span>
          <h2>
            Welkom <em>binnen.</em>
          </h2>
        </div>
        <div className="experience-window-controls">
          <button
            className="fullscreen-button"
            onClick={toggleFullscreen}
            aria-label={
              fullscreen ? "Verlaat volledig scherm" : "Volledig scherm"
            }
          >
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            <span>{fullscreen ? "Verkleinen" : "Volledig scherm"}</span>
          </button>
          <button
            className="experience-close"
            onClick={closeTour}
            aria-label="Sluit 3D rondleiding"
          >
            <X />
          </button>
        </div>
      </div>
      <div className="experience-stage">
        <SceneCanvas
          mode={mode}
          level={level}
          apartment={unit}
          command={command}
          movement={movement}
          onFailure={() => setFailed(true)}
        />
        <div className="experience-badge">
          {mode === "exterior" ? "Het gebouw" : `Appartement ${unit}`}
          <span>
            {mode === "walk"
              ? "Ooghoogte · 1,62 m"
              : mode === "overview"
                ? "Open verdiepingsmodel"
                : "3D gebouwmodel"}
          </span>
        </div>
        {mode === "walk" && !failed && (
          <div className="crosshair" aria-hidden="true" />
        )}
        <div className="scene-actions">
          <button aria-label="3D inzoomen" onClick={() => send("zoomIn")}>
            <Plus size={18} />
          </button>
          <button aria-label="3D uitzoomen" onClick={() => send("zoomOut")}>
            <Minus size={18} />
          </button>
          <button aria-label="3D startpositie" onClick={() => send("reset")}>
            <RotateCcw size={18} />
          </button>
        </div>
        {mode === "walk" && !failed && <Joystick onMove={setMovement} />}
      </div>
      <div className="experience-controls">
        <div className="experience-modes">
          <button
            aria-pressed={mode === "walk"}
            onClick={() => setMode("walk")}
          >
            <Footprints size={17} />
            Binnen wandelen
          </button>
          <button
            aria-pressed={mode === "overview"}
            onClick={() => setMode("overview")}
          >
            <Layers size={17} />
            Verdieping
          </button>
          <button
            aria-pressed={mode === "exterior"}
            onClick={() => setMode("exterior")}
          >
            <Move size={17} />
            Buiten bekijken
          </button>
        </div>
        <div className="experience-selectors">
          <label>
            Niveau
            <select
              aria-label="Niveau"
              value={level}
              onChange={(e) => chooseLevel(Number(e.target.value))}
            >
              {[0, 1, 2].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Gelijkvloers" : `Verdieping ${n}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            Appartement
            <select
              aria-label="Appartement"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {Array.from(
                { length: level === 2 ? 2 : 4 },
                (_, i) => `${level}.${i + 1}`,
              ).map((id) => (
                <option key={id}>{id}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {screenMessage && (
        <p className="screen-status" role="status">
          {screenMessage}
        </p>
      )}
      <div className="experience-help">
        <p>
          {mode === "walk"
            ? "Sleep om rond te kijken. Klik in het beeld en loop met W A S D of de pijltjestoetsen. Gebruik de joystick met uw muis of vinger om te wandelen."
            : "Sleep om het gebouw te draaien. Knijp met twee vingers of scroll om in en uit te zoomen."}
        </p>
        <details>
          <summary>Over deze 3D-weergave</summary>
          <p>
            Wandcontouren en verdiepingsvormen zijn rechtstreeks uit de
            architectuurplannen opgebouwd. Openingen worden als uitsparingen
            getoond. Meubilair, materialen en het omringende landschap zijn een
            indicatieve aankleding. Dit is een vereenvoudigd ruimtelijk model;
            raamdetails, deuren, leuningen en dakafwerking zijn nog niet
            volledig gereconstrueerd. De originele plannen blijven leidend.
          </p>
        </details>
        {failed && (
          <button className="button" onClick={closeTour}>
            Terug naar de plannen
          </button>
        )}
      </div>
    </dialog>
  );
}
