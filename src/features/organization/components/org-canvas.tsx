import { Maximize2, Minus, Plus } from "lucide-react";
import { type PointerEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 1.2;
const EDGE_PADDING = 24;

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/**
 * Pan/zoom viewport for the org chart.
 *
 * Zoom is anchored to the pointer rather than the centre, so the point under
 * the cursor stays put — the behaviour every map and design tool has, and the
 * thing that makes wheel-zoom feel controlled instead of slippery.
 */
export function OrgCanvas({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const { t } = useTranslation("organization");
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: EDGE_PADDING, y: EDGE_PADDING });
  const [panning, setPanning] = useState(false);

  // Read in the wheel listener, which is registered once and must not close
  // over stale state.
  const viewRef = useRef({ zoom, offset });
  viewRef.current = { zoom, offset };

  const zoomAt = useCallback((next: number, originX: number, originY: number) => {
    const { zoom: current, offset: currentOffset } = viewRef.current;
    const clamped = clampZoom(next);
    const ratio = clamped / current;
    setZoom(clamped);
    setOffset({
      x: originX - (originX - currentOffset.x) * ratio,
      y: originY - (originY - currentOffset.y) * ratio,
    });
  }, []);

  const resetView = useCallback(() => {
    const el = containerRef.current;
    setZoom(1);
    setOffset({
      x: el ? Math.max(EDGE_PADDING, (el.clientWidth - width) / 2) : EDGE_PADDING,
      y: EDGE_PADDING,
    });
  }, [width]);

  // Centre on first paint only. Re-centring whenever `width` changes would
  // yank the viewport back every time a department is added.
  const hasCentred = useRef(false);
  useEffect(() => {
    if (hasCentred.current) return;
    hasCentred.current = true;
    resetView();
  }, [resetView]);

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    // Registered natively rather than via onWheel: React's synthetic wheel
    // listener is passive, so it cannot preventDefault, and the page would
    // scroll behind the canvas.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const lines = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
      const factor = Math.exp(-e.deltaY * lines * (e.ctrlKey ? 0.01 : 0.0015));
      zoomAtRef.current(viewRef.current.zoom * factor, e.clientX - rect.left, e.clientY - rect.top);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    // Let clicks through to the node buttons.
    if (e.button === 0 && (e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!panning) return;
    setOffset((o) => ({ x: o.x + e.movementX, y: o.y + e.movementY }));
  };

  const endPan = () => setPanning(false);

  const zoomFromCentre = (factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    zoomAt(viewRef.current.zoom * factor, el.clientWidth / 2, el.clientHeight / 2);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        className={cn(
          "relative h-[540px] w-full touch-none overflow-hidden bg-muted/20",
          panning ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width,
            height,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          {children}
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-4 left-4 text-xs text-muted-foreground">
        {t("canvas.panHint")}
      </p>

      <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-md border bg-background/90 p-1 shadow-sm backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => zoomFromCentre(1 / ZOOM_STEP)}
          aria-label={t("canvas.zoomOut")}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="tnum w-11 text-center text-xs text-muted-foreground">
          {t("canvas.zoomLevel", { percent: Math.round(zoom * 100) })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => zoomFromCentre(ZOOM_STEP)}
          aria-label={t("canvas.zoomIn")}
        >
          <Plus className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={resetView}
          aria-label={t("canvas.resetView")}
        >
          <Maximize2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
