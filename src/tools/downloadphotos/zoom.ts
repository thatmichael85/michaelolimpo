// Zoom & pan for the photo viewer, ported from the original static tool and attached to the
// Astryx Lightbox's <dialog>. Lightbox's own `hasZoom` only toggles a fixed 2x on double-click
// (no wheel, no pinch), so it stays off and this controller drives the <img> transform instead:
// wheel / trackpad-pinch zoom toward the pointer, two-finger pinch, drag to pan, click (mouse) or
// double-tap (touch) toggles, +/-/0 keys, arrows pan while zoomed.

export const ZMIN = 1;
export const ZMAX = 6;
export const ZTAP = 2.5;

export interface ZoomController {
  zoomBy(factor: number): void;
  fit(): void;
  reset(): void;
  destroy(): void;
}

export function attachViewerZoom(dialog: HTMLDialogElement, onZoomChange?: (zoom: number) => void, onClose?: () => void): ZoomController {
  let zoom = 1;
  let tx = 0;
  let ty = 0;
  const ptrs = new Map<number, { x: number; y: number }>();
  type Gesture = { moved: boolean; x: number; y: number; sx?: number; sy?: number; dist?: number };
  let gesture: Gesture | null = null;
  let suppressClick = false;
  let lastTap: { t: number; x: number; y: number } | null = null;
  let lastPtrType = 'mouse';

  const img = () => dialog.querySelector<HTMLImageElement>('img');
  const wrapper = () => img()?.parentElement ?? null;
  const container = () => dialog.firstElementChild;
  const isBackdrop = (t: EventTarget | null) => t === dialog || t === container();
  const isControl = (t: EventTarget | null) =>
    t instanceof Element && !!t.closest('button, a, input, select, [data-viewer-caption]');

  dialog.style.touchAction = 'none'; // the viewer owns all gestures while open (pinch/pan)

  function prepare() {
    // let the zoomed photo use the whole screen instead of being clipped to its fitted box
    const w = wrapper();
    if (w) {
      w.style.overflow = 'visible';
      if (w.parentElement) w.parentElement.style.overflow = 'visible';
    }
  }

  function apply(animate = false) {
    const el = img();
    const w = wrapper();
    if (!el || !w) return;
    prepare();
    const box = w.getBoundingClientRect(); // untransformed box (the transform is on the img)
    const view = dialog.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const W = el.offsetWidth * zoom;
    const H = el.offsetHeight * zoom;
    // clamp pan: a zoomed photo may not leave a gap on a side where it's bigger than the screen
    const clamp = (t: number, size: number, c: number, lo: number, hi: number) =>
      size <= hi - lo ? 0 : Math.min(lo - c + size / 2, Math.max(hi - c - size / 2, t));
    tx = clamp(tx, W, cx, view.left, view.right);
    ty = clamp(ty, H, cy, view.top, view.bottom);
    el.style.transition = animate ? 'transform .15s ease' : 'none';
    el.style.transform = zoom === 1 ? '' : `translate(${tx}px, ${ty}px) scale(${zoom})`;
    dialog.dataset.zoomed = zoom > 1 ? 'true' : 'false';
    onZoomChange?.(zoom);
  }

  // zoom to z keeping screen point (px, py) fixed; defaults to the photo centre
  function zoomAt(z: number, px?: number, py?: number, animate = false) {
    const w = wrapper();
    if (!w) return;
    const r = w.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (px == null || py == null) {
      px = cx + tx;
      py = cy + ty;
    }
    z = Math.min(ZMAX, Math.max(ZMIN, z));
    const k = z / zoom;
    tx = px - cx - (px - cx - tx) * k;
    ty = py - cy - (py - cy - ty) * k;
    zoom = z;
    if (zoom === 1) tx = ty = 0;
    apply(animate);
  }

  function reset() {
    zoom = 1;
    tx = ty = 0;
    ptrs.clear();
    gesture = null;
    apply(false);
  }

  const toggle = (px: number, py: number) => (zoom > 1 ? zoomAt(1, 0, 0, true) : zoomAt(ZTAP, px, py, true));

  function pinchInfo() {
    const [a, b] = [...ptrs.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, dist: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
  }

  const onWheel = (e: WheelEvent) => {
    if (isControl(e.target)) return;
    e.preventDefault(); // ctrl+wheel = trackpad pinch; plain wheel zooms too
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    zoomAt(zoom * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.002)), e.clientX, e.clientY);
  };

  const onPointerDown = (e: PointerEvent) => {
    lastPtrType = e.pointerType;
    suppressClick = false;
    if (e.button !== 0 || isControl(e.target)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) gesture = { moved: true, ...pinchInfo() };
    else if (ptrs.size === 1) gesture = { moved: false, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
    // capture only once there's something to drag, so plain clicks keep their real target
    if (zoom > 1 || ptrs.size === 2) dialog.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    const p = ptrs.get(e.pointerId);
    if (!p || !gesture) return;
    p.x = e.clientX;
    p.y = e.clientY;
    if (ptrs.size === 2) {
      const g = pinchInfo();
      tx += g.x - gesture.x;
      ty += g.y - gesture.y;
      zoomAt((zoom * g.dist) / (gesture.dist || g.dist), g.x, g.y);
      Object.assign(gesture, g);
    } else if (ptrs.size === 1) {
      if (!gesture.moved && Math.hypot(e.clientX - (gesture.sx ?? 0), e.clientY - (gesture.sy ?? 0)) > 5) {
        gesture.moved = true;
        dialog.setPointerCapture(e.pointerId);
      }
      if (gesture.moved && zoom > 1) {
        tx += e.clientX - gesture.x;
        ty += e.clientY - gesture.y;
        apply(false);
        dialog.dataset.panning = 'true';
      }
      gesture.x = e.clientX;
      gesture.y = e.clientY;
    }
  };

  const endPointer = (e: PointerEvent) => {
    if (!ptrs.delete(e.pointerId) || !gesture) return;
    const g = gesture;
    if (g.moved) suppressClick = true; // a drag/pinch must never count as a click (e.g. close on backdrop)
    if (ptrs.size === 1) {
      // pinch -> one finger left: continue as a pan from here
      const [q] = ptrs.values();
      gesture = { moved: true, x: q.x, y: q.y };
      return;
    }
    gesture = null;
    delete dialog.dataset.panning;
    // touch double-tap toggles zoom (mouse uses a single click, handled in onClick)
    if (e.type === 'pointerup' && e.pointerType !== 'mouse' && !g.moved) {
      const now = Date.now();
      if (lastTap && now - lastTap.t < 300 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
        toggle(e.clientX, e.clientY);
        lastTap = null;
        suppressClick = true;
      } else lastTap = { t: now, x: e.clientX, y: e.clientY };
    }
  };

  // Capture phase, so we can stop Lightbox's backdrop-close for drags and zoomed taps.
  const onClick = (e: MouseEvent) => {
    if (suppressClick) {
      suppressClick = false;
      if (isBackdrop(e.target) || !isControl(e.target)) e.stopPropagation();
      return;
    }
    if (isControl(e.target)) return;
    const touch = lastPtrType !== 'mouse';
    const w = wrapper();
    if (w && e.target === img() && zoom === 1) {
      if (!touch) zoomAt(ZTAP, e.clientX, e.clientY, true);
    } else if (zoom > 1) {
      // when zoomed, a backdrop click returns to fit instead of closing
      e.stopPropagation();
      if (!touch) zoomAt(1, 0, 0, true);
    }
    else if (onClose) { e.stopPropagation(); onClose(); }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('input, select, textarea')) return;
    if (e.key === '+' || e.key === '=') zoomAt(zoom * 1.5, undefined, undefined, true);
    else if (e.key === '-') zoomAt(zoom / 1.5, undefined, undefined, true);
    else if (e.key === '0') zoomAt(1, undefined, undefined, true);
    else if (zoom > 1 && e.key.startsWith('Arrow')) {
      // arrows pan while zoomed (Lightbox would otherwise navigate)
      const step = 60;
      if (e.key === 'ArrowLeft') tx += step;
      if (e.key === 'ArrowRight') tx -= step;
      if (e.key === 'ArrowUp') ty += step;
      if (e.key === 'ArrowDown') ty -= step;
      apply(true);
    } else return;
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragStart = (e: Event) => e.preventDefault();
  const onResize = () => apply(false);

  dialog.addEventListener('wheel', onWheel, { passive: false });
  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('click', onClick, true);
  dialog.addEventListener('keydown', onKeyDown, true);
  dialog.addEventListener('dragstart', onDragStart);
  // move/up are watched on window so a drag that ends outside the photo is still seen as a drag
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  window.addEventListener('resize', onResize);

  return {
    zoomBy: (f) => zoomAt(zoom * f, undefined, undefined, true),
    fit: () => zoomAt(1, undefined, undefined, true),
    reset,
    destroy() {
      dialog.removeEventListener('wheel', onWheel);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('click', onClick, true);
      dialog.removeEventListener('keydown', onKeyDown, true);
      dialog.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endPointer);
      window.removeEventListener('pointercancel', endPointer);
      window.removeEventListener('resize', onResize);
    },
  };
}
