import { GraphStoresContainer } from "../../state/storesContainer";

export const handleViewportFocus = ($states: GraphStoresContainer) => {
    if (!$states.graphics.viewportFocus) return;
    if ($states.graphics.viewportFocus === "all") return handleZoomToAll($states);

    const highlightedThought = $states.graphics.viewportFocus;
    const viewport = $states.graphics.viewport;
    if (highlightedThought !== null) {
        const dx = viewport.position.x - highlightedThought.x;
        const dy = viewport.position.y - highlightedThought.y;
        // console.log(dx, dy, lockedOnHighlighted);
        const threshold = 10;
        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
            $states.graphics.viewport.moveBy({ x: (dx - threshold) / 50, y: (dy - threshold) / 50 });
        }
        // const idealZoom = INITIAL_ZOOM - ((INITIAL_ZOOM) / (highlightedThought.radius / MAX_RADIUS));
        // const dz = idealZoom - viewport.zoom;
        // console.log(dz);
        // if (Math.abs(dz) > 0.1) {
        //     graphState.viewport.zoomByButtonDelta(Math.sign(dz));
        // }
    }

}

const handleZoomToAll = ($states: GraphStoresContainer) => {

}