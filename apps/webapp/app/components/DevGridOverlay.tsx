import { useEffect, useRef, useState } from "react";
import { trail } from "agentcrumbs"; // @crumbs

const crumb = trail("webapp:dev-grid"); // @crumbs
const SHORTCUT_INTERVAL_MS = 600;

/** Viewport measurement aid, mounted only by the development build. */
export function DevGridOverlay() {
  const [visible, setVisible] = useState(false);
  const crosshairRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    let shifts = 0;
    let lastKeyTime = 0;
    const reset = () => {
      shifts = 0;
      lastKeyTime = 0;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target;
      if (
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (target instanceof HTMLElement &&
          (target.isContentEditable || target.closest("input, textarea, select, [role='textbox']")))
      ) {
        reset();
        return;
      }

      const now = performance.now();
      if (now - lastKeyTime > SHORTCUT_INTERVAL_MS) shifts = 0;
      if (event.key === "Shift") {
        shifts = Math.min(shifts + 1, 2);
        lastKeyTime = now;
        return;
      }
      if (event.code === "KeyG" && shifts === 2) {
        event.preventDefault();
        crumb("toggle requested"); // @crumbs
        setVisible((value) => !value);
      }
      reset();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("blur", reset);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const onPointerMove = (event: PointerEvent) => {
      x = Math.round(event.clientX / 4) * 4;
      y = Math.round(event.clientY / 4) * 4;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const crosshair = crosshairRef.current;
        if (crosshair) {
          crosshair.style.setProperty("--cursor-x", `${x}px`);
          crosshair.style.setProperty("--cursor-y", `${y}px`);
          crosshair.style.visibility = "visible";
        }
      });
    };
    const hideCrosshair = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (crosshairRef.current) crosshairRef.current.style.visibility = "hidden";
    };
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) hideCrosshair();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("blur", hideCrosshair);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", hideCrosshair);
    };
  }, [visible]);

  if (!import.meta.env.DEV || !visible) return null;

  return (
    <div
      aria-hidden="true"
      data-dev-grid-overlay
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: "none",
        backgroundImage:
          "linear-gradient(to right, rgba(0, 170, 255, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 170, 255, 0.12) 1px, transparent 1px), linear-gradient(to right, rgba(0, 170, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 170, 255, 0.03) 1px, transparent 1px)",
        backgroundSize: "16px 16px, 16px 16px, 4px 4px, 4px 4px",
      }}
    >
      <div ref={crosshairRef} style={{ visibility: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "var(--cursor-x)",
            width: 1,
            background: "#f472b6",
            boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.25)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "var(--cursor-y)",
            height: 1,
            background: "#f472b6",
            boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.25)",
          }}
        />
      </div>
    </div>
  );
}
