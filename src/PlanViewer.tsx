import React, { useEffect, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import metadata from "./asset-metadata.json";
export function SafeImage({
  src,
  alt,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const size = metadata[src as keyof typeof metadata];
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? (
    <div className="image-error" role="status">
      Deze tekening kan niet worden geladen. De woninggegevens blijven hieronder
      beschikbaar.
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      width={size?.width}
      height={size?.height}
      loading={props.fetchPriority === "high" ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
export function PlanViewer({
  src,
  alt,
  children,
}: {
  src: string;
  alt: string;
  children?: React.ReactNode;
}) {
  const [zoom, setZoom] = useState(1);
  useEffect(() => setZoom(1), [src]);
  return (
    <div className="viewer">
      <div
        className="viewer-scroll"
        tabIndex={0}
        aria-label={`${alt}. Gebruik de zoomknoppen en scroll om de tekening te verkennen.`}
      >
        <div
          className="viewer-canvas"
          style={
            { width: `${zoom * 100}%`, "--zoom": zoom } as React.CSSProperties
          }
        >
          <SafeImage src={src} alt={alt} />
          {children}
        </div>
      </div>
      <div className="zoom-controls">
        <button
          aria-label="Uitzoomen"
          disabled={zoom <= 1}
          onClick={() => setZoom(Math.max(1, zoom - 0.5))}
        >
          <Minus size={17} />
        </button>
        <span aria-live="polite">{zoom * 100}%</span>
        <button
          aria-label="Inzoomen"
          disabled={zoom >= 3}
          onClick={() => setZoom(Math.min(3, zoom + 0.5))}
        >
          <Plus size={17} />
        </button>
        <button aria-label="Zoom herstellen" onClick={() => setZoom(1)}>
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
