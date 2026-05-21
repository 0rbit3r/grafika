import { GraphStoresContainer } from "../../state/storesContainer";

const threshold = 10;

export const handleViewportFocus = ($states: GraphStoresContainer) => {
    const focus = $states.graphics.viewportFocus;
    if (!focus) return;
    if (focus.target === "all") return handleZoomToAll($states, focus.padding);

    const node = focus.target;
    const viewport = $states.graphics.viewport;

    const dx = viewport.position.x - node.x;
    const dy = viewport.position.y - node.y;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        $states.graphics.viewport.moveBy({ x: (dx - threshold) / 50, y: (dy - threshold) / 50 });
    }

    const currentScreenSize = node.radius * viewport.zoom * 2;
    const targetScreenSize = focus.padding !== undefined
        ? Math.min(viewport.width, viewport.height) * (1 - focus.padding)
        : 30;
    const zoomRatio = targetScreenSize / currentScreenSize;

    if (Math.abs(zoomRatio - 1) > 0.01) {
        const smoothZoom = 1 + (zoomRatio - 1) / 200;
        $states.graphics.viewport.zoomBy(smoothZoom, { x: node.x, y: node.y });
    }
}

const handleZoomToAll = ($states: GraphStoresContainer, padding?: number) => {
    const nodes = $states.context.renderedNodes;
    if (nodes.length === 0) return;

    const viewport = $states.graphics.viewport;

    let minX: number, maxX: number, minY: number, maxY: number;
    if (nodes.length === 1) {
        const n = nodes[0];
        minX = n.x - n.radius;
        maxX = n.x + n.radius;
        minY = n.y - n.radius;
        maxY = n.y + n.radius;
    } else {
        minX = Infinity; maxX = -Infinity; minY = Infinity; maxY = -Infinity;
        for (const n of nodes) {
            if (n.x < minX) minX = n.x;
            if (n.x > maxX) maxX = n.x;
            if (n.y < minY) minY = n.y;
            if (n.y > maxY) maxY = n.y;
        }
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const largerDimension = Math.max(contentWidth, contentHeight);
    const desiredCenterX = minX + contentWidth / 2;
    const desiredCenterY = minY + contentHeight / 2;

    const dx = viewport.position.x - desiredCenterX;
    const dy = viewport.position.y - desiredCenterY;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        $states.graphics.viewport.moveBy({ x: (dx - threshold) / 200, y: (dy - threshold) / 200 });
    }

    const fill = padding !== undefined
        ? (1 - padding)
        : $states.context.renderedNodes.length > 3
            ? 0.95
            : 0.5;
    const currentScreenSize = largerDimension * viewport.zoom;
    const targetScreenSize = Math.min(viewport.width, viewport.height) * fill;
    const zoomRatio = targetScreenSize / currentScreenSize;

    if (Math.abs(zoomRatio - 1) > 0.01) {
        const smoothZoom = 1 + (zoomRatio - 1) / 50;
        $states.graphics.viewport.zoomBy(smoothZoom);
    }
}
