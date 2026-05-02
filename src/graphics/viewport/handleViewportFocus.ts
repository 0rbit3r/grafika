import { GraphStoresContainer } from "../../state/storesContainer";

const threshold = 10;
const nodeToScreenRatio = 0.1;

export const handleViewportFocus = ($states: GraphStoresContainer) => {
    if (!$states.graphics.viewportFocus) return;
    if ($states.graphics.viewportFocus === "all") return handleZoomToAll($states);

    const highlightedNode = $states.graphics.viewportFocus;
    const viewport = $states.graphics.viewport;
    if (highlightedNode !== null) {
        const dx = viewport.position.x - highlightedNode.x;
        const dy = viewport.position.y - highlightedNode.y;
        // console.log(dx, dy, lockedOnHighlighted);
        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
            $states.graphics.viewport.moveBy({ x: (dx - threshold) / 50, y: (dy - threshold) / 50 });
        }
        // zoom so that the node takes up N% of the screen
        const currentScreenSize = highlightedNode.radius * viewport.zoom * 2;
        const targetScreenSize = 30;
        const zoomRatio = targetScreenSize / currentScreenSize;

        if (Math.abs(zoomRatio - 1) > 0.01) {
            const smoothZoom = 1 + (zoomRatio - 1) / 200;
            $states.graphics.viewport.zoomBy(smoothZoom);
        }
    }
}

const handleZoomToAll = ($states: GraphStoresContainer) => {
    const viewport = $states.graphics.viewport;

    //todo - this is just fucking awful man
    const minX = Math.min(...$states.context.renderedNodes.map(n => n.x));
    const maxX = Math.max(...$states.context.renderedNodes.map(n => n.x));
    const minY = Math.min(...$states.context.renderedNodes.map(n => n.y));
    const maxY = Math.max(...$states.context.renderedNodes.map(n => n.y));


    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const largerDimention = Math.max(contentHeight, contentWidth);
    const desiredCenterX = minX + contentWidth / 2;
    const desiredCenterY = minY + contentHeight / 2;

    const dx = viewport.position.x - desiredCenterX;
    const dy = viewport.position.y - desiredCenterY;
    // console.log(dx, dy, lockedOnHighlighted);
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        $states.graphics.viewport.moveBy({ x: (dx - threshold) / 200, y: (dy - threshold) / 200 });
    }

    // zoom so that the node takes up N% of the screen
    const currentScreenSize = largerDimention * viewport.zoom;
    const targetScreenSize = Math.min(viewport.width, viewport.height) * 0.95;
    const zoomRatio = targetScreenSize / currentScreenSize;

    if (Math.abs(zoomRatio - 1) > 0.01) {
        const smoothZoom = 1 + (zoomRatio - 1) / 50;
        $states.graphics.viewport.zoomBy(smoothZoom);
    }
}