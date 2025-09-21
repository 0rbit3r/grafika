import { XAndY } from "../api/dataTypes";
import { RenderedEdge } from "../core/renderedEdge";
import { RenderedNode } from "../core/renderedNode";
import { GraphicsStore } from "../state/graphicsStore";

export const handleNodeLoading = (node: RenderedNode, $graphics: GraphicsStore, pos?: XAndY) => {
    if (pos === undefined) pos = $graphics.viewport.toViewportCoordinates({x:node.x, y: node.y});

    const margin = node.radius * 4 * $graphics.viewport.zoom;
    const isInside =
        (!$graphics.overlaySettings || $graphics.viewport.zoom > $graphics.overlaySettings.startDisappearingAt)
        && pos.x > -margin && pos.x < $graphics.viewport.width + margin
        && pos.y > -margin && pos.y < $graphics.viewport.height + margin;

    if (!node.isOnScreen) {
        if (isInside) {
            node.isOnScreen = true;
            node.sprite && $graphics.nodeContainer.addChild(node.sprite);
            node.text && $graphics.textContainer.addChild(node.text);
        }
    } else if (!isInside && !node.held) {
        node.isOnScreen = false;
        node.sprite && $graphics.nodeContainer.removeChild(node.sprite);
        node.text && $graphics.textContainer.removeChild(node.text);
    }
}

export const handleEdgeLoading = (edge: RenderedEdge, $graphics: GraphicsStore,
    srcViewportCoors?: XAndY, tgtViewportCoors?: XAndY // yeah, I can just calculate them, but in the tight loop, I don't want to keep recalculating these
) => {
    if (srcViewportCoors === undefined) srcViewportCoors = $graphics.viewport.toViewportCoordinates({x: edge.source.x, y: edge.source.y});
    if (tgtViewportCoors === undefined) tgtViewportCoors = $graphics.viewport.toViewportCoordinates({x: edge.target.x, y: edge.target.y});


    // todo: the bounding box checker here is spowed out by ai - double check

    const viewRect = { x: 0, y: 0, w: $graphics.viewport.width, h: $graphics.viewport.height };
    const margin = 100 * $graphics.viewport.zoom; // todo - parametrize

    // axis-aligned bounding box of the segment
    const minX = Math.min(srcViewportCoors.x, tgtViewportCoors.x) - margin;
    const maxX = Math.max(srcViewportCoors.x, tgtViewportCoors.x) + margin;
    const minY = Math.min(srcViewportCoors.y, tgtViewportCoors.y) - margin;
    const maxY = Math.max(srcViewportCoors.y, tgtViewportCoors.y) + margin;

    // test against viewport rect
    const inside =
        (!$graphics.overlaySettings || $graphics.viewport.zoom > $graphics.overlaySettings.startDisappearingAt) &&
        maxX >= viewRect.x &&
        minX <= viewRect.x + viewRect.w &&
        maxY >= viewRect.y &&
        minY <= viewRect.y + viewRect.h;

    if (!edge.isOnScreen && inside) {
        edge.isOnScreen = true;
        edge.sprite && $graphics.edgeContainer.addChild(edge.sprite);
    } else if (edge.isOnScreen && !inside) {
        edge.isOnScreen = false;
        edge.sprite && $graphics.edgeContainer.removeChild(edge.sprite);
    }
}