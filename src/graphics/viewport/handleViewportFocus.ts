import { GraphStoresContainer } from "../../state/storesContainer";
import { XAndY } from "../../api/dataTypes";
import { MIN_ZOOM, MAX_ZOOM } from "../../core/defaultGraphOptions";
import { Viewport } from "./viewport";

// Camera-travel tuning. The viewport moves along a parabolic arc in
// (position, ln(zoom)) space: for a far jump it bows out (zooms out), drifts
// across, then bows back in. Near jumps degenerate to a plain smooth glide.
const FILL_FRACTION = 0.85;   // fraction of the screen the pan span fills at the arc apex
const COMFORT_ZOOM_CAP = 1.5; // max zoom for "all" — guards the single-node runaway
const MIN_SPAN = 400;         // floor on bbox span (world units) so span->0 can't blow up
const EPS = 1e-3;             // floor on pan distance

// Flight progress is advanced asymptotically — each frame closes a fixed
// fraction of the remaining gap. That launches with pace and then decelerates
// forever into a soft landing rather than stopping abruptly (the old spring's
// flowy feel), now riding on top of the parabolic arc.
const APPROACH_RATE = 0.012;

// Hand off to settle once the arc is all but complete and already crawling, so
// the transition carries no visible velocity jump.
const SETTLE_THRESHOLD = 0.999;

// Settle phase: gentle log-space follow of the (still-moving) target.
const SETTLE_RATE = 0.01;

const LN_MIN_ZOOM = Math.log(MIN_ZOOM);

interface TargetPose {
    pos: XAndY;
    w: number; // ln(zoom)
}

export const handleViewportFocus = ($states: GraphStoresContainer) => {
    const focus = $states.graphics.viewportFocus;
    if (!focus) return;

    const viewport = $states.graphics.viewport;
    // Elapsed frames since last tick (1.0 @60fps, 2.0 @30fps) — makes the
    // spring advances framerate-independent so jittery pacing doesn't stutter.
    const deltaFrames = $states.graphics.app.ticker.deltaTime;
    const target = resolveTarget($states);
    if (!target) return; // nothing to focus (e.g. "all" with no nodes)

    // (re)start a journey when the focus object is fresh
    if (focus.progress === undefined) {
        focus.startPos = { x: viewport.position.x, y: viewport.position.y };
        focus.startW = Math.log(viewport.zoom);
        focus.progress = 0;
        focus.phase = "flight";
    }

    if (focus.phase === "settle") {
        settleFollow(viewport, target, deltaFrames);
        return;
    }

    const startPos = focus.startPos!;
    const startW = focus.startW!;

    // Arc geometry — recomputed each frame so a moving target adapts.
    const panDistance = Math.hypot(target.pos.x - startPos.x, target.pos.y - startPos.y);
    const screenMin = Math.min(viewport.width, viewport.height);
    const wFit = Math.log(FILL_FRACTION * screenMin / Math.max(panDistance, EPS));
    const wLinearMid = (startW + target.w) / 2;
    const wApex = Math.max(LN_MIN_ZOOM, wLinearMid - Math.max(0, wLinearMid - wFit));
    const dip = wLinearMid - wApex; // 0 for near targets => straight glide

    // Asymptotic advance: fast launch, ever-decelerating soft approach.
    // Exponential-decay form so the per-frame rate stays correct under variable
    // framerate (a plain `* deltaFrames` would diverge for large steps).
    focus.progress += (1 - focus.progress) * (1 - Math.pow(1 - APPROACH_RATE, deltaFrames));

    // Write the absolute pose along the arc at the new progress. Pan is a plain
    // lerp — the asymptotic progress already supplies the ease-out, so adding a
    // smoothstep on top would over-slow the landing.
    const t = focus.progress;
    viewport.position.x = startPos.x + (target.pos.x - startPos.x) * t;
    viewport.position.y = startPos.y + (target.pos.y - startPos.y) * t;
    viewport.zoom = clampZoom(Math.exp(arcZoom(startW, target.w, dip, t)));

    if (focus.progress >= SETTLE_THRESHOLD) focus.phase = "settle";
};

// Parabola in log-zoom space: linear interpolation minus a downward bow.
const arcZoom = (startW: number, targetW: number, dip: number, t: number) =>
    startW + (targetW - startW) * t - dip * 4 * t * (1 - t);

const settleFollow = (viewport: Viewport, target: TargetPose, deltaFrames: number) => {
    const rate = 1 - Math.pow(1 - SETTLE_RATE, deltaFrames);
    viewport.position.x += (target.pos.x - viewport.position.x) * rate;
    viewport.position.y += (target.pos.y - viewport.position.y) * rate;
    const w = Math.log(viewport.zoom);
    viewport.zoom = clampZoom(Math.exp(w + (target.w - w) * rate));
};

// Resolves the live target camera pose for whichever focus kind is active.
// Same downstream arc handles all kinds; only this differs per target.
const resolveTarget = ($states: GraphStoresContainer): TargetPose | null => {
    const focus = $states.graphics.viewportFocus!;
    const viewport = $states.graphics.viewport;
    const screenMin = Math.min(viewport.width, viewport.height);

    if (focus.target === "all") {
        const nodes = $states.context.renderedNodes;
        if (nodes.size === 0) return null;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const node of nodes.values()) {
            if (node.x < minX) minX = node.x;
            if (node.x > maxX) maxX = node.x;
            if (node.y < minY) minY = node.y;
            if (node.y > maxY) maxY = node.y;
        }

        const span = Math.max(maxX - minX, maxY - minY, MIN_SPAN);
        const fill = focus.padding !== undefined
            ? (1 - focus.padding)
            : nodes.size > 3 ? 0.95 : 0.5;
        const zoom = Math.min(COMFORT_ZOOM_CAP, clampZoom(fill * screenMin / span));
        return { pos: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, w: Math.log(zoom) };
    }

    // Single node: keep today's target of a ~30px (or padding-driven) on-screen size.
    const node = focus.target;
    const targetScreenSize = focus.padding !== undefined
        ? screenMin * (1 - focus.padding)
        : 30;
    const zoom = clampZoom(targetScreenSize / (2 * node.radius));
    return { pos: { x: node.x, y: node.y }, w: Math.log(zoom) };
};

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
