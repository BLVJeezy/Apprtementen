import { useState } from "react";
import SceneCanvas from "./SceneCanvas";
import { SafeImage } from "../PlanViewer";
export default function HeroScene({ paused = false }: { paused?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <SafeImage
      className="scene-fallback"
      src="/assets/elevation-front.webp"
      alt="Voorgevel volgens het architectuurplan"
    />
  ) : (
    <SceneCanvas
      paused={paused}
      hero
      mode="exterior"
      level={0}
      apartment="0.1"
      onFailure={() => setFailed(true)}
    />
  );
}
