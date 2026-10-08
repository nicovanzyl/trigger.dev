import { useFetcher } from "@remix-run/react";
import { LayoutGroup } from "framer-motion";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { trail } from "agentcrumbs"; // @crumbs
import { LeftSideMenuCollapsedIcon } from "~/assets/icons/LeftSideMenuCollapsedIcon";
import { LeftSideMenuIcon } from "~/assets/icons/LeftSideMenuIcon";
import { useShortcutKeys } from "~/hooks/useShortcutKeys";
import { type UserWithDashboardPreferences } from "~/models/user.server";
import { type SideMenuSectionId } from "./sideMenuTypes";
import { cn } from "~/utils/cn";
import { Button } from "../primitives/Buttons";
import { ShortcutKey } from "../primitives/ShortcutKey";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../primitives/Tooltip";
import { ShortcutsAutoOpen } from "../Shortcuts";
import { HelpAndFeedback } from "./HelpAndFeedbackPopover";

const crumb = trail("webapp.sidebar"); // @crumbs
// --- Resizable side menu -----------------------------------------------------
// A drag handle on the right edge resizes the menu. Width-driven visuals read two CSS variables
// written to the root each frame (no React re-render, so drags stay smooth):
//   --sm-collapse:      0 (>= default width) → 1 (collapsed)
//   --sm-label-opacity: 1 → 0, a faster fade curve of --sm-collapse

/** Collapsed rail width in px (matches the previous `w-11`). */
const COLLAPSED_WIDTH = 44;
/** The default/again-expanded width in px (matches the previous `w-56`). */
const DEFAULT_WIDTH = 224;
/** The widest the menu can be dragged, in px. */
const MAX_WIDTH = 400;
/** Duration of the collapse/expand/snap animation, in ms. */
const COLLAPSE_ANIM_MS = 200;
/** Fraction of the collapse range over which labels fade to 0 (0.6 = fully faded at 60% collapsed). */
const LABEL_FADE_FRACTION = 0.6;
/**
 * Snap thresholds as collapse progress (0 = default, 1 = collapsed): release at <= threshold springs
 * open, past it collapses. Separate per direction so releasing early continues the gesture.
 */
const COLLAPSE_SNAP_THRESHOLD = 0.25;
const EXPAND_SNAP_THRESHOLD = 0.9;
/** Pointer travel (px) below which a press on the handle counts as a click (toggle), not a drag. */
const DRAG_CLICK_THRESHOLD = 4;

/** Match the organization row's 4px inset in both expanded and collapsed layouts. */
export const SIDE_MENU_PAD_X = "0.25rem";
/**
 * Scroll-body right padding DURING a transition (settled-open uses the reserved gutter instead).
 * Interpolates from the measured gutter width (seamless handoff) to 4px collapsed; the 4px fallback
 * is only for the first paint before `--sm-sb-gutter` is measured.
 */
const SIDE_MENU_SCROLL_PAD_RIGHT = `calc(var(--sm-sb-gutter, 4px) - (var(--sm-sb-gutter, 4px) - 0.25rem) * var(--sm-collapse, 0))`;
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Collapse progress (0 = at/above default width, 1 = collapsed) for a given px width. */
function widthToProgress(width: number) {
  return clamp((DEFAULT_WIDTH - width) / (DEFAULT_WIDTH - COLLAPSED_WIDTH), 0, 1);
}

/** Label opacity (1 → 0) for a given collapse progress, using the faster fade curve. */
function progressToLabelOpacity(progress: number) {
  return clamp((LABEL_FADE_FRACTION - progress) / LABEL_FADE_FRACTION, 0, 1);
}

/** cubic-bezier(0.4, 0, 0.2, 1) — standard easing for the rAF tween, matching the CSS transitions. */
function easeStandard(t: number) {
  // Solve the bezier for x = t, then return y. Control points: p1 = (0.4, 0), p2 = (0.2, 1).
  const x1 = 0.4;
  const y1 = 0;
  const x2 = 0.2;
  const y2 = 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;
  const sampleDerivativeX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  // Newton-Raphson to invert x(u) = t.
  let u = t;
  for (let i = 0; i < 6; i++) {
    const x = sampleX(u) - t;
    const dx = sampleDerivativeX(u);
    if (Math.abs(x) < 1e-4 || Math.abs(dx) < 1e-6) break;
    u -= x / dx;
  }
  return sampleY(clamp(u, 0, 1));
}

export function useSideMenuLayout(
  user: Pick<UserWithDashboardPreferences, "dashboardPreferences"> & { isImpersonating: boolean }
) {
  const [isCollapsed, setIsCollapsed] = useState(
    user.dashboardPreferences.sideMenu?.isCollapsed ?? false
  );
  const [isDragging, setIsDragging] = useState(false);
  // True during a click/⌘B/release-snap animation. With isDragging, marks any in-flight transition
  // (the gutter is only reserved once settled — see `showReservedGutter`).
  const [isAnimating, setIsAnimating] = useState(false);
  // Direction of an in-flight drag, for the Free-plan banner slide. A drag that started expanded is a
  // close (the banner tracks it down); one that started collapsed is an open (the banner stays hidden
  // until fully open, then rises). Only meaningful while `isDragging`.
  const [dragStartedCollapsed, setDragStartedCollapsed] = useState(false);

  // --- Resize state (see the module constants above) ---
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  // Mirror of `isCollapsed` for the drag handlers (outside React's render cycle; no stale closures).
  const isCollapsedRef = useRef(isCollapsed);
  // Freeze first-paint values so React never fights the imperative width writes after hydration.
  const [initialVisual] = useState(() => {
    const collapsed = user.dashboardPreferences.sideMenu?.isCollapsed ?? false;
    const expandedWidth = clamp(
      user.dashboardPreferences.sideMenu?.width ?? DEFAULT_WIDTH,
      DEFAULT_WIDTH,
      MAX_WIDTH
    );
    const width = collapsed ? COLLAPSED_WIDTH : expandedWidth;
    const progress = collapsed ? 1 : 0;

    return {
      expandedWidth,
      width,
      progress,
      style: {
        width,
        "--sm-collapse": String(progress),
        "--sm-label-opacity": String(progressToLabelOpacity(progress)),
      } as CSSProperties,
    };
  });
  // The last-committed expanded width; animation targets and re-expansion read from here.
  const expandedWidthRef = useRef(initialVisual.expandedWidth);
  const widthRef = useRef(initialVisual.width);
  const progressRef = useRef(initialVisual.progress);
  // Removes an in-flight drag's window listeners (set on pointerdown; cleared on finish/unmount).
  const dragCleanupRef = useRef<(() => void) | null>(null);

  const preferencesFetcher = useFetcher();
  const pendingPreferencesRef = useRef<{
    isCollapsed?: boolean;
    width?: number;
    sectionId?: SideMenuSectionId;
    sectionCollapsed?: boolean;
  }>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const persistSideMenuPreferences = useCallback(
    (data: {
      isCollapsed?: boolean;
      width?: number;
      sectionId?: SideMenuSectionId;
      sectionCollapsed?: boolean;
    }) => {
      if (user.isImpersonating) return;
      crumb("preferences queued", data); // @crumbs

      // Merge with any pending changes
      pendingPreferencesRef.current = {
        ...pendingPreferencesRef.current,
        ...data,
      };

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the actual submission by 500ms
      debounceTimeoutRef.current = setTimeout(() => {
        const pending = pendingPreferencesRef.current;
        const formData = new FormData();
        if (pending.isCollapsed !== undefined) {
          formData.append("isCollapsed", String(pending.isCollapsed));
        }
        if (pending.width !== undefined) {
          formData.append("width", String(pending.width));
        }
        if (pending.sectionId !== undefined && pending.sectionCollapsed !== undefined) {
          formData.append("sectionId", pending.sectionId);
          formData.append("sectionCollapsed", String(pending.sectionCollapsed));
        }
        preferencesFetcher.submit(formData, {
          method: "POST",
          action: "/resources/preferences/sidemenu",
        });
        pendingPreferencesRef.current = {};
      }, 500);
    },
    [user.isImpersonating, preferencesFetcher]
  );

  // Flush routine in a ref so the unmount effect can have empty deps. `useFetcher` returns a fresh
  // object each render, so depending on it would fire the cleanup (flushing the debounce) every
  // render — and drags re-render constantly — instead of only on unmount.
  const flushPendingPreferencesRef = useRef<() => void>();
  // oxlint-disable-next-line react/refs -- This ref intentionally coordinates an imperative integration outside React state.
  flushPendingPreferencesRef.current = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (user.isImpersonating) return;
    const pending = pendingPreferencesRef.current;
    const hasPendingChanges =
      pending.isCollapsed !== undefined ||
      pending.width !== undefined ||
      (pending.sectionId !== undefined && pending.sectionCollapsed !== undefined);
    if (!hasPendingChanges) return;

    const formData = new FormData();
    if (pending.isCollapsed !== undefined) {
      formData.append("isCollapsed", String(pending.isCollapsed));
    }
    if (pending.width !== undefined) {
      formData.append("width", String(pending.width));
    }
    if (pending.sectionId !== undefined && pending.sectionCollapsed !== undefined) {
      formData.append("sectionId", pending.sectionId);
      formData.append("sectionCollapsed", String(pending.sectionCollapsed));
    }
    preferencesFetcher.submit(formData, {
      method: "POST",
      action: "/resources/preferences/sidemenu",
    });
    pendingPreferencesRef.current = {};
  };

  // Flush pending preferences on unmount. Empty deps so cleanup runs only on a real unmount
  // (see flushPendingPreferencesRef).
  useEffect(() => {
    return () => flushPendingPreferencesRef.current?.();
  }, []);

  // Measure the reserved scrollbar-gutter width once and expose it as `--sm-sb-gutter` (the padding
  // hands off to it seamlessly; platform-dependent, so it must be measured). A probe with the same
  // scrollbar classes is measured so the value matches what that styling reserves.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const probe = document.createElement("div");
    probe.className = "scrollbar-gutter-stable scrollbar-thumb-on-hover [--sm-sb-width:4px]";
    probe.style.cssText =
      "position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow-y:auto;visibility:hidden;";
    document.body.appendChild(probe);
    const gutter = probe.offsetWidth - probe.clientWidth;
    document.body.removeChild(probe);
    if (gutter > 0) el.style.setProperty("--sm-sb-gutter", `${gutter}px`);
  }, []);

  // Write width + collapse vars straight to the DOM (no re-render) so drags stay smooth; all
  // width-driven visuals (labels, headers, padding, dividers) read them.
  const writeVisual = useCallback((width: number, progress: number) => {
    widthRef.current = width;
    progressRef.current = progress;
    const el = rootRef.current;
    if (!el) return;
    el.style.width = `${width}px`;
    el.style.setProperty("--sm-collapse", String(progress));
    el.style.setProperty("--sm-label-opacity", String(progressToLabelOpacity(progress)));
  }, []);

  // Animate width + progress over COLLAPSE_ANIM_MS (toggle button, ⌘B shortcut, release-snap).

  const animateTo = useCallback(
    (targetWidth: number, targetProgress: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      const startWidth = widthRef.current;
      const startProgress = progressRef.current;
      if (startWidth === targetWidth && startProgress === targetProgress) {
        setIsAnimating(false);
        return;
      }
      setIsAnimating(true);
      const startTime = performance.now();
      const step = (now: number) => {
        const t = clamp((now - startTime) / COLLAPSE_ANIM_MS, 0, 1);
        const eased = easeStandard(t);
        writeVisual(
          startWidth + (targetWidth - startWidth) * eased,
          startProgress + (targetProgress - startProgress) * eased
        );
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          writeVisual(targetWidth, targetProgress);
          setIsAnimating(false);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [writeVisual]
  );

  // Collapse/expand to a resting state and remember it.
  const applyCollapsed = useCallback(
    (next: boolean) => {
      isCollapsedRef.current = next;
      setIsCollapsed(next);
      persistSideMenuPreferences({ isCollapsed: next });
      animateTo(next ? COLLAPSED_WIDTH : expandedWidthRef.current, next ? 1 : 0);
    },
    [animateTo, persistSideMenuPreferences]
  );

  const handleToggleCollapsed = useCallback(() => {
    applyCollapsed(!isCollapsedRef.current);
  }, [applyCollapsed]);

  // Drag runs on window-level listeners so releasing anywhere finalizes it. (Pointer capture alone
  // was unreliable: if the browser drops it mid-drag, the release never fires and the menu strands.)

  const onHandlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      // Capture just quiets hover states while dragging; the drag doesn't depend on it.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Grabbing the handle interrupts any in-flight collapse/expand; clear the flag so a drag that
      // rests via writeVisual (not animateTo) doesn't strand it true and keep the gutter hidden.
      setIsAnimating(false);
      // Never allow two concurrent drags.
      dragCleanupRef.current?.();

      const drag = {
        startX: e.clientX,
        startWidth: rootRef.current?.getBoundingClientRect().width ?? widthRef.current,
        startedCollapsed: isCollapsedRef.current,
        didDrag: false,
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("blur", onCancel);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        dragCleanupRef.current = null;
      };

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - drag.startX;
        if (!drag.didDrag) {
          // Ignore tiny movement so a click still reads as a click (toggle), not a drag.
          if (Math.abs(dx) < DRAG_CLICK_THRESHOLD) return;
          drag.didDrag = true;
          setIsDragging(true);
          setDragStartedCollapsed(drag.startedCollapsed);
          document.body.style.userSelect = "none";
          document.body.style.cursor = "col-resize";
        }
        const width = clamp(drag.startWidth + dx, COLLAPSED_WIDTH, MAX_WIDTH);
        writeVisual(width, widthToProgress(width));
      };

      const onUp = () => {
        cleanup();
        setIsDragging(false);

        // A press with no meaningful drag toggles the menu.
        if (!drag.didDrag) {
          applyCollapsed(!isCollapsedRef.current);
          return;
        }

        const width = widthRef.current;
        // A drag that started collapsed is an opening gesture: flip the snap zone so an early
        // release keeps opening.
        const snapThreshold = drag.startedCollapsed
          ? EXPAND_SNAP_THRESHOLD
          : COLLAPSE_SNAP_THRESHOLD;
        if (width >= DEFAULT_WIDTH) {
          // Rest at the dragged width.
          const rounded = Math.round(width);
          expandedWidthRef.current = rounded;
          isCollapsedRef.current = false;
          setIsCollapsed(false);
          persistSideMenuPreferences({ isCollapsed: false, width: rounded });
          writeVisual(rounded, 0);
        } else if (widthToProgress(width) <= snapThreshold) {
          // Released near the default width — spring back open.
          expandedWidthRef.current = DEFAULT_WIDTH;
          isCollapsedRef.current = false;
          setIsCollapsed(false);
          persistSideMenuPreferences({ isCollapsed: false, width: DEFAULT_WIDTH });
          animateTo(DEFAULT_WIDTH, 0);
        } else {
          // Released deeper in (or over-dragged past min width) — collapse the rest of the way.
          isCollapsedRef.current = true;
          setIsCollapsed(true);
          persistSideMenuPreferences({ isCollapsed: true });
          animateTo(COLLAPSED_WIDTH, 1);
        }
      };

      const onCancel = () => {
        cleanup();
        setIsDragging(false);
        if (!drag.didDrag) return;
        // Settle back to the current resting state.
        animateTo(
          isCollapsedRef.current ? COLLAPSED_WIDTH : expandedWidthRef.current,
          isCollapsedRef.current ? 1 : 0
        );
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("blur", onCancel);
      dragCleanupRef.current = cleanup;
    },
    [animateTo, applyCollapsed, persistSideMenuPreferences, writeVisual]
  );

  // Keep the drag handlers' collapsed mirror in sync; tear down any in-flight animation/drag on unmount.
  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      dragCleanupRef.current?.();
    };
  }, []);

  useShortcutKeys({
    shortcut: { modifiers: ["mod"], key: "b", enabledOnInputElements: true },
    action: handleToggleCollapsed,
  });

  // Reserve the scrollbar gutter only when fully settled open (stops the list shifting as it starts/
  // stops overflowing). Dropped mid-transition so the right padding can animate instead of a fixed
  // gutter snapping away (see SIDE_MENU_SCROLL_PAD_RIGHT).
  const showReservedGutter = !isCollapsed && !isDragging && !isAnimating;

  return {
    rootRef,
    initialVisual,
    isCollapsed,
    isDragging,
    isAnimating,
    dragStartedCollapsed,
    showReservedGutter,
    onHandlePointerDown,
    handleToggleCollapsed,
    persistSideMenuPreferences,
  };
}

export type SideMenuLayout = ReturnType<typeof useSideMenuLayout>;

export function SideMenuShell({
  layout: { rootRef, initialVisual, isCollapsed, isDragging, onHandlePointerDown },
  className,
  children,
}: {
  layout: SideMenuLayout;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      ref={rootRef}
      style={initialVisual.style}
      className={cn(
        "relative h-full border-r border-grid-bright bg-background-bright [--sm-sb-width:4px]",
        className
      )}
    >
      <ResizeHandle
        isCollapsed={isCollapsed}
        isDragging={isDragging}
        onPointerDown={onHandlePointerDown}
      />
      {children}
    </div>
  );
}

export function SideMenuScroll({
  layout,
  children,
}: {
  layout: SideMenuLayout;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-h-0 overflow-y-auto pt-2.5",
        layout.showReservedGutter
          ? "scrollbar-gutter-stable scrollbar-thumb-on-hover"
          : "scrollbar-none"
      )}
    >
      <div
        className="mb-6 flex w-full flex-col gap-4 overflow-hidden"
        style={{
          paddingLeft: SIDE_MENU_PAD_X,
          paddingRight: layout.showReservedGutter ? "0px" : SIDE_MENU_SCROLL_PAD_RIGHT,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function SideMenuFooterControls({
  isCollapsed,
  isDragging,
  organizationId,
  projectId,
  onToggleCollapsed,
}: {
  isCollapsed: boolean;
  isDragging: boolean;
  organizationId?: string;
  projectId?: string;
  onToggleCollapsed: () => void;
}) {
  return (
    <LayoutGroup>
      <div
        className={cn(
          "flex w-full",
          isCollapsed ? "flex-col-reverse gap-1" : "items-center justify-between"
        )}
      >
        <ShortcutsAutoOpen />
        <HelpAndFeedback
          isCollapsed={isCollapsed}
          organizationId={organizationId}
          projectId={projectId}
        />
        <CollapseMenuButton
          isCollapsed={isCollapsed}
          isDragging={isDragging}
          onToggle={onToggleCollapsed}
        />
      </div>
    </LayoutGroup>
  );
}

function CollapseMenuButton({
  isCollapsed,
  isDragging = false,
  onToggle,
}: {
  isCollapsed: boolean;
  isDragging?: boolean;
  onToggle: () => void;
}) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    // Shrink-and-fade only while dragging CLOSED, where this sits beside Help & Feedback and would
    // overlap it as the row narrows. Dragging OPEN it stays put: collapsed, this IS the expand
    // affordance, and the 0->1 variable would make the icon grow from nothing. At rest: natural size.
    <div
      className={cn(isDragging && !isCollapsed && "pointer-events-none overflow-hidden")}
      style={
        isDragging && !isCollapsed
          ? {
              maxWidth: "calc(var(--sm-label-opacity, 1) * 32px)",
              opacity: "var(--sm-label-opacity, 1)",
            }
          : undefined
      }
    >
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={isCollapsed ? 0 : 500}>
          <TooltipTrigger asChild>
            <span
              className={cn("inline-flex h-8", isCollapsed && "w-full")}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <Button
                variant="small-menu-item"
                aria-label={isCollapsed ? "Expand side menu" : "Collapse side menu"}
                onClick={onToggle}
                fullWidth={isCollapsed}
                className={cn("h-full w-8 pl-1.5 pr-2", isCollapsed && "justify-center")}
              >
                {isCollapsed ? (
                  <LeftSideMenuCollapsedIcon
                    className={cn(
                      "size-4.5 transition-colors",
                      isHovering ? "text-text-bright" : "text-text-dimmed"
                    )}
                  />
                ) : (
                  <LeftSideMenuIcon
                    className={cn(
                      "size-4.5 transition-colors",
                      isHovering ? "text-text-bright" : "text-text-dimmed"
                    )}
                    hovered={isHovering}
                  />
                )}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} className="flex items-center gap-2 text-xs">
            {isCollapsed ? "Expand" : "Collapse"}
            <span className="flex items-center">
              <ShortcutKey shortcut={{ modifiers: ["mod"] }} variant="medium/bright" />
              <ShortcutKey shortcut={{ key: "b" }} variant="medium/bright" />
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

/**
 * Resize affordance straddling the menu's right border: hover reveals an indigo line, drag resizes,
 * click toggles collapsed/expanded, and the tooltip follows the pointer's Y. The strip extends 4px
 * past the edge, so the menu root deliberately has no overflow-hidden (only its inner grid does).
 */
function ResizeHandle({
  isCollapsed,
  isDragging,
  onPointerDown,
}: {
  isCollapsed: boolean;
  isDragging: boolean;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  // Fully controlled so open never flips controlled/uncontrolled mid-interaction; open requests
  // during a drag are dropped.
  const [isTooltipOpen, setTooltipOpen] = useState(false);
  // Pointer Y within the strip — anchors the tooltip beside the cursor, not the strip's center.
  const [anchorY, setAnchorY] = useState(0);

  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip
        delayDuration={500}
        open={isTooltipOpen && !isDragging}
        onOpenChange={(open) => setTooltipOpen(open && !isDragging)}
      >
        <TooltipTrigger asChild>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize side menu"
            onPointerDown={onPointerDown}
            onPointerMove={(e) => {
              if (isDragging) return;
              setAnchorY(Math.round(e.clientY - e.currentTarget.getBoundingClientRect().top));
            }}
            className="group/resize absolute inset-y-0 -right-1 z-30 w-2 cursor-col-resize touch-none"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-y-0 left-1/2 w-0.75 -translate-x-1/2 bg-indigo-500 opacity-0 transition-opacity duration-300",
                isDragging ? "opacity-100" : "group-hover/resize:opacity-100"
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="start"
          alignOffset={anchorY - 22}
          sideOffset={8}
          className="flex flex-col gap-1 text-xs"
        >
          <span>Drag to resize</span>
          <span className="flex items-center gap-1 text-text-dimmed">
            {isCollapsed ? "Click to expand" : "Click to collapse"}
            <span className="flex items-center">
              <ShortcutKey shortcut={{ modifiers: ["mod"] }} variant="medium/bright" />
              <ShortcutKey shortcut={{ key: "b" }} variant="medium/bright" />
            </span>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
