import { Application, Container, TextStyle, Text, Circle } from "pixi.js";
import { DRAG_Z, EDGES_Z, NODES_Z, TEXT_Z } from "./zIndexes";
import { GraphStoresContainer } from "../state/storesContainer";
import { EdgeType, XAndY } from "../api/dataTypes";
import { BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE, BACKDROP_ZOOM_THRESHOLD_HIDDEN, DEFAULT_RADIUS, ZOOM_TEXT_INVISIBLE_THRESHOLD, ZOOM_TEXT_VISIBLE_THRESHOLD } from "../core/defaultGraphOptions";
import { initBackdrop } from "./initBackdrop";
import { SPRITE_TEXTURE_RADIUS } from "./sprites/nodeSprites";
import { EDGE_SPRITE_LENGTH } from "./sprites/edgeSprites";
import { Viewport } from "./viewport";
import { RenderedEdge } from "../core/renderedEdge";
import { GraphicsStore } from "../state/graphicsStore";
import { RenderedNode } from "../core/renderedNode";

export const initGraphics = (app: Application, $states: GraphStoresContainer) => {
    app.stage.eventMode = 'static';
    const zSortedContainer = new Container();
    zSortedContainer.sortableChildren = true;
    app.stage.addChild(zSortedContainer);

    const nodeContainer = $states.graphics.get().nodeContainer;
    const textContainer = $states.graphics.get().textContainer;
    const debugContainer = $states.graphics.get().debugContainer;
    textContainer.eventMode = "none";

    const edgeContainer = $states.graphics.get().edgeContainer;

    const viewport = $states.graphics.get().viewport;

    zSortedContainer.addChild(viewport.dragContainer);

    // nodeGraphics.sortableChildren = true;
    viewport.dragContainer.zIndex = DRAG_Z;
    nodeContainer.zIndex = NODES_Z;
    textContainer.zIndex = TEXT_Z;
    edgeContainer.zIndex = EDGES_Z;
    debugContainer.zIndex = TEXT_Z;

    zSortedContainer.addChild(nodeContainer);
    zSortedContainer.addChild(textContainer);
    zSortedContainer.addChild(edgeContainer);
    zSortedContainer.addChild(debugContainer);

    // const backdropUrl = "/backdrop.png";

    // const backdrop = initBackdrop(backdropUrl);
    // zSortedContainer.addChild(backdrop);

    zSortedContainer.sortChildren();

    const fpsCounter: Text = new Text('0', new TextStyle({ fontSize: 20, fill: "#ffffff" }));
    fpsCounter.x = 20;
    fpsCounter.y = app.screen.height - 40;
    const updateFpsEveryNFrames = 10;
    const fpsRollingHistory: number[] = [];
    if ($states.debug.get().showFps) {
        debugContainer.addChild(fpsCounter);
    }

    let $simulation = $states.simulation.get();
    let $debug = $states.debug.get();
    let $graphics = $states.graphics.get();
    let $context = $states.context.get();
    let zoom = 0;
    const renderGraph = () => {
        $simulation = $states.simulation.get();
        $debug = $states.debug.get();
        $graphics = $states.graphics.get();
        $context = $states.context.get();
        zoom = $graphics.viewport.zoom;

        // FPS counter
        if ($debug.showFps) {
            const fps = $graphics.app.ticker.FPS;
            fpsRollingHistory.push(fps);
            if (fpsRollingHistory.length > updateFpsEveryNFrames)
                fpsRollingHistory.shift();
            if ($simulation.frame % updateFpsEveryNFrames === 0 && $simulation.frame >= 10) {
                fpsCounter.text = Math.floor(fpsRollingHistory.reduce((a, b) => a + b) / fpsRollingHistory.length);
            }
        }

        $graphics.textContainer.alpha = zoom <= ZOOM_TEXT_INVISIBLE_THRESHOLD
            ? 0
            : zoom >= ZOOM_TEXT_VISIBLE_THRESHOLD
                ? 1
                : 1 - (ZOOM_TEXT_VISIBLE_THRESHOLD - zoom) /
                (ZOOM_TEXT_VISIBLE_THRESHOLD - ZOOM_TEXT_INVISIBLE_THRESHOLD);

        // if (backdrop !== undefined) {

        //     // BACKDROP
        //     const sizeOnScreen = 27.75 * zoom;
        //     const onScreenCoors = $graphics.viewport.toViewportCoordinates(
        //         { x: -41600, y: -41600 }
        //     );

        //     backdrop.setTransform(
        //         onScreenCoors.x, onScreenCoors.y,
        //         sizeOnScreen, sizeOnScreen);
        //     const backdropOpacity =
        //         1 - Math.min(1, Math.max(0, zoom - BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE)
        //             / (BACKDROP_ZOOM_THRESHOLD_HIDDEN - BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE));

        //     backdrop.alpha = 0.5;//backdropOpacity;

        //     nodeContainer.alpha = 0.5; //1 - backdropOpacity;
        //     textContainer.alpha = nodeContainer.alpha;
        //     edgeContainer.alpha = nodeContainer.alpha;
        // }

        // render thoughts on screen
        $context.renderedNodes
            .forEach(node => {
                // handle positions
                const viewportPos = $graphics.viewport.toViewportCoordinates({ x: node.x, y: node.y });
                handleNodeLoading(viewport, node, $graphics, $states, viewportPos);

                const scale = zoom * node.radius / SPRITE_TEXTURE_RADIUS;
                node.sprite?.setTransform(viewportPos.x, viewportPos.y, scale, scale);
                // handle dynamic effects
                // node.blinkingGraphics.alpha = $simulation.frame % 150 < 50
                //     ? 1 - ($simulation.frame % 50) / 50
                //     : 0;

                zoom >= ZOOM_TEXT_INVISIBLE_THRESHOLD &&
                    node.text?.setTransform(viewportPos.x - node.text.width / 2, viewportPos.y + node.radius * 1.1 * zoom);
            });

        $context.renderedEdges.forEach(edge => {
            const srcViewportCoors = $graphics.viewport.toViewportCoordinates({ x: edge.source.x, y: edge.source.y });
            const tgtViewportCoors = $graphics.viewport.toViewportCoordinates({ x: edge.target.x, y: edge.target.y });
            handleEdgeLoading(viewport, edge, $graphics, srcViewportCoors, tgtViewportCoors);
            if (!edge.isOnScreen || edge.type === EdgeType.None) return;

            const dx = tgtViewportCoors.x - srcViewportCoors.x;
            const dy = tgtViewportCoors.y - srcViewportCoors.y;
            const length = Math.hypot(dx, dy);
            const scaleX = length / EDGE_SPRITE_LENGTH;
            const angle = Math.atan2(dy, dx);

            edge.sprite && edge.sprite.setTransform(srcViewportCoors.x, srcViewportCoors.y, scaleX, zoom, angle);
        })
    };

    renderGraph();

    return renderGraph;
}

const handleNodeLoading = (viewport: Viewport, node: RenderedNode, $graphics: GraphicsStore,
    $states: GraphStoresContainer, pos: XAndY) => {
    const margin = node.radius * 4 * viewport.zoom;
    const isInside =
        pos.x > -margin && pos.x < viewport.width + margin &&
        pos.y > -margin && pos.y < viewport.height + margin;

    if (!node.isOnScreen) {
        if (isInside) {
            node.isOnScreen = true;
            node.sprite && $graphics.nodeContainer.addChild(node.sprite);
            node.text && $graphics.textContainer.addChild(node.text);
        }
    } else if (!isInside) {
        node.isOnScreen = false;
        node.sprite && $graphics.nodeContainer.removeChild(node.sprite);
        node.text && $graphics.textContainer.removeChild(node.text);
    }
}

const handleEdgeLoading = (viewport: Viewport, edge: RenderedEdge, $graphics: GraphicsStore,
    srcViewportCoors: XAndY, tgtViewportCoors: XAndY // yeah, I can just calculate them, but in the tight loop, I don't want to keep recalculating these
) => {
    // todo: the bounding box checker here is spowed out by ai - double check

    const viewRect = { x: 0, y: 0, w: viewport.width, h: viewport.height };
    const margin = 100 * viewport.zoom; // todo - parametrize

    // axis-aligned bounding box of the segment
    const minX = Math.min(srcViewportCoors.x, tgtViewportCoors.x) - margin;
    const maxX = Math.max(srcViewportCoors.x, tgtViewportCoors.x) + margin;
    const minY = Math.min(srcViewportCoors.y, tgtViewportCoors.y) - margin;
    const maxY = Math.max(srcViewportCoors.y, tgtViewportCoors.y) + margin;

    // test against viewport rect
    const inside =
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