import { GraphStoresContainer } from "../../state/storesContainer";
import { XAndY } from "../../api/dataTypes";
import { MIN_ZOOM, MAX_ZOOM } from "../../core/defaultGraphOptions";
import { Viewport } from "./viewport";

// Camera-travel tuning. The viewport follows the van Wijk & Nuij (2003) optimal
// smooth pan-zoom path: for a far jump it bows out (zooms out), drifts across,
// then bows back in, while provably keeping both endpoints framed throughout.
// Near jumps degenerate to a plain smooth glide.
const RHO = 1.4;              // van Wijk curvature (~sqrt2); lower => more zoom-out on far jumps
const RHO2 = RHO * RHO;
const RHO4 = RHO2 * RHO2;
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

// Per-frame EMA rate that low-passes the live target before flight/settle read
// it. High enough to track genuine graph growth, low enough to reject the
// transient bbox spikes from a node appearing/leaving for a few frames.
const TARGET_SMOOTH_RATE = 0.01;

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
        // Seed the smoothed pose at the raw target so the first frame isn't a lurch.
        focus.smoothedTarget = { pos: { x: target.pos.x, y: target.pos.y }, w: target.w };
    }

    // Low-pass the live target. Everything downstream reads this, not `target`,
    // so noise in the live bbox is filtered before it reaches the camera.
    const smoothed = focus.smoothedTarget!;
    const smoothRate = 1 - Math.pow(1 - TARGET_SMOOTH_RATE, deltaFrames);
    smoothed.pos.x += (target.pos.x - smoothed.pos.x) * smoothRate;
    smoothed.pos.y += (target.pos.y - smoothed.pos.y) * smoothRate;
    smoothed.w += (target.w - smoothed.w) * smoothRate;

    if (focus.phase === "settle") {
        settleFollow(viewport, smoothed, deltaFrames);
        return;
    }

    const startPos = focus.startPos!;
    const startW = focus.startW!;

    // Asymptotic advance: fast launch, ever-decelerating soft approach.
    // Exponential-decay form so the per-frame rate stays correct under variable
    // framerate (a plain `* deltaFrames` would diverge for large steps). The
    // normalized progress p drives the path's s-parameter; the van Wijk path
    // shape is independent of this timing layer.
    focus.progress += (1 - focus.progress) * (1 - Math.pow(1 - APPROACH_RATE, deltaFrames));
    const p = focus.progress;

    // Van Wijk path in world units, recomputed each frame so a moving target
    // adapts. The viewport's visible world width is screenMin / zoom; pan
    // distance is already in world units, so the two are dimensionally
    // consistent. Path runs from the fixed journey start to the smoothed target.
    const screenMin = Math.min(viewport.width, viewport.height);
    const w0 = screenMin / Math.exp(startW);
    const w1 = screenMin / Math.exp(smoothed.w);
    const dx = smoothed.pos.x - startPos.x;
    const dy = smoothed.pos.y - startPos.y;
    const d1 = Math.hypot(dx, dy);

    if (d1 < EPS) {
        // Pure zoom, no pan — the general form is singular here, so glide the
        // zoom in log space and hold the (shared) center.
        viewport.position.x = smoothed.pos.x;
        viewport.position.y = smoothed.pos.y;
        viewport.zoom = clampZoom(Math.exp(startW + (smoothed.w - startW) * p));
    } else {
        const b0 = (w1 * w1 - w0 * w0 + RHO4 * d1 * d1) / (2 * w0 * RHO2 * d1);
        const b1 = (w1 * w1 - w0 * w0 - RHO4 * d1 * d1) / (2 * w1 * RHO2 * d1);
        const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
        const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
        const S = (r1 - r0) / RHO;

        if (!isFinite(S) || Math.abs(S) < EPS) {
            // Start ~= target: snap to the target pose.
            viewport.position.x = smoothed.pos.x;
            viewport.position.y = smoothed.pos.y;
            viewport.zoom = clampZoom(Math.exp(smoothed.w));
        } else {
            const s = p * S;
            const coshr0 = Math.cosh(r0);
            const u = w0 / (RHO2 * d1) * (coshr0 * Math.tanh(RHO * s + r0) - Math.sinh(r0));
            viewport.position.x = startPos.x + u * dx; // u in [0,1], = 1 at s = S
            viewport.position.y = startPos.y + u * dy;
            const w = w0 * coshr0 / Math.cosh(RHO * s + r0);
            viewport.zoom = clampZoom(screenMin / w);
        }
    }

    if (focus.progress >= SETTLE_THRESHOLD) focus.phase = "settle";
};

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
            : nodes.size > 3 ? 0.95 : 0.6;
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
