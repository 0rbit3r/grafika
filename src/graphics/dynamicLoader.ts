import { XAndY } from "../api/dataTypes";
import { RenderedEdge } from "../core/renderedEdge";
import { RenderedNode } from "../core/renderedNode";
import { GraphicsStore } from "../state/graphicsStore";

const loadNode = (node: RenderedNode, $graphics: GraphicsStore) => {
    node.isLoadedOnScreen = true;
    node.sprite && $graphics.nodeContainer.addChild(node.sprite);
    node.renderedText && $graphics.textContainer.addChild(node.renderedText);
}
const unloadNode = (node: RenderedNode, $graphics: GraphicsStore) => {
    node.isLoadedOnScreen = false;
    node.sprite && $graphics.nodeContainer.removeChild(node.sprite);
    node.renderedText && $graphics.textContainer.removeChild(node.renderedText);
};

export const handleNodeLoading = (node: RenderedNode, $graphics: GraphicsStore) => {
    if (node.framesAlive < 0) return;
    // console.log(node.framesAlive, node.timeToLiveTo);
    if (node.timeToLiveTo !== undefined && (node.framesAlive >= node.timeToLiveTo)) {
        if (node.isLoadedOnScreen)
        unloadNode(node, $graphics);
        return;
    }
    const viewportPosition = $graphics.viewport.toViewportCoordinates({ x: node.x, y: node.y });

    const margin = node.radius * 4 * $graphics.viewport.zoom;
    const isInsideViewport =
        (!$graphics.overlaySettings || $graphics.viewport.zoom > $graphics.overlaySettings.startDisappearingAt)
        && viewportPosition.x > -margin && viewportPosition.x < $graphics.viewport.width + margin
        && viewportPosition.y > -margin && viewportPosition.y < $graphics.viewport.height + margin;

    if (!node.isLoadedOnScreen) {
        if (isInsideViewport) {
            loadNode(node, $graphics);
        }
    } else if (!isInsideViewport && !node.held) {
        unloadNode(node, $graphics);
    }

    // if (isInside && $graphics.viewport.zoom < 0.25)
    //     node.sprite?.eventMode && (node.sprite.eventMode= "none"); Might improve performance when zoomed out, but in practice, id doesn't really?
}

export const handleEdgeLoading = (edge: RenderedEdge, $graphics: GraphicsStore,
    srcViewportCoors?: XAndY, tgtViewportCoors?: XAndY // yeah, I can just calculate them, but in the tight loop, I don't want to keep recalculating these
) => {
    if (edge.source.framesAlive < 0) return;
    if (edge.target.framesAlive < 0) return;

    if (edge.source.timeToLiveTo && (edge.source.timeToLiveTo <= edge.source.framesAlive) ||
        edge.target.timeToLiveTo && (edge.target.timeToLiveTo <= edge.target.framesAlive)) {
        if (edge.isLoadedOnScreen) {
            edge.isLoadedOnScreen = false;
            edge.sprite && $graphics.edgeContainer.removeChild(edge.sprite);
        }
        return;
    }


    if (srcViewportCoors === undefined) srcViewportCoors = $graphics.viewport.toViewportCoordinates({ x: edge.source.x, y: edge.source.y });
    if (tgtViewportCoors === undefined) tgtViewportCoors = $graphics.viewport.toViewportCoordinates({ x: edge.target.x, y: edge.target.y });

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

    if (!edge.isLoadedOnScreen && inside) {
        edge.isLoadedOnScreen = true;
        edge.sprite && $graphics.edgeContainer.addChild(edge.sprite);
    } else if (edge.isLoadedOnScreen && !inside) {
        edge.isLoadedOnScreen = false;
        edge.sprite && $graphics.edgeContainer.removeChild(edge.sprite);
    }
}