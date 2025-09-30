import { Application, Container, TextStyle, Text, Sprite, Assets } from "pixi.js";
import { DRAG_Z, EDGES_Z, NODES_Z, TEXT_Z } from "./zIndexes";
import { GraphStoresContainer } from "../state/storesContainer";
import { EdgeType, NodeShape } from "../api/dataTypes";
import { NODE_BORDER_THICKNESS, ZOOM_TEXT_INVISIBLE_THRESHOLD, ZOOM_TEXT_VISIBLE_THRESHOLD } from "../core/defaultGraphOptions";
import { initOverlay } from "./overlay/initOverlay";
import { SPRITE_TEXTURE_RADIUS } from "./sprites/nodeSprites";
import { EDGE_SPRITE_LENGTH, TAPERED_EDGE_WIDTH } from "./sprites/edgeSprites";
import { handleOverlay } from "./overlay/handleOverlay";
import { handleNodeLoading, handleEdgeLoading } from "./dynamicLoader";
import { initBackdrop } from "./backdrop/initBackdrop";
import { handleBackdrop } from "./backdrop/handleBackdrop";

export const initGraphics = (app: Application, $states: GraphStoresContainer) => {
    app.stage.eventMode = 'static';
    const zSortedContainer = new Container();
    zSortedContainer.sortableChildren = true;
    app.stage.addChild(zSortedContainer);

    const nodeContainer = $states.graphics.nodeContainer;
    const textContainer = $states.graphics.textContainer;
    const debugContainer = $states.graphics.debugContainer;
    const edgeContainer = $states.graphics.edgeContainer;

    nodeContainer.eventMode = "passive";
    textContainer.eventMode = "none";
    debugContainer.eventMode = "none";
    edgeContainer.eventMode = "none";

    const viewport = $states.graphics.viewport;

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

    // Handle node dragging logic here as not to plague individual nodes with pointermove events...
    // app.stage.on('pointermove', e => {
    //     const heldNode = $states.context.heldNode;
    //     if (app.ticker.started && heldNode !== undefined) {
    //             if (!heldNode.held) return; 
    //             const zoom = viewport.zoom;
    //             heldNode.x += e.movementX / zoom;
    //             heldNode.y += e.movementY / zoom;
    //             $states.interactionEvents.emit("nodeDragged", getNodeProxy(heldNode, $states));
    //             // console.log(renderedNode.x, renderedNode.graphics.x);
    //     }
    // });

    let $simulation = $states.simulation;
    let $debug = $states.debug;
    let $graphics = $states.graphics;
    let $context = $states.context;
    let zoom = 0;
    let displacementAngleRotation = 0;

    let overlaySprite: Sprite;
    if ($graphics.overlaySettings !== undefined) {
        overlaySprite = initOverlay($graphics.overlaySettings.url);
        zSortedContainer.addChild(overlaySprite);
        $states.graphics.unloadOverlayTexture = () => {
            if ($graphics.overlaySettings?.url) return Assets.unload($graphics.overlaySettings.url);
            else { return Promise.resolve() }
        };
    }

    let backdropSprite: Sprite;
    if ($graphics.backdropSettings !== undefined) {
        backdropSprite = initBackdrop($graphics.backdropSettings.url);
        zSortedContainer.addChild(backdropSprite);
        $states.graphics.unloadBackdropTexture = () => {
            if ($graphics.backdropSettings?.url) return Assets.unload($graphics.backdropSettings.url);
            else { return Promise.resolve() }
        };
    }
    

    zSortedContainer.sortChildren();

    const fpsCounter: Text = new Text('0', new TextStyle({ fontSize: 20, fill: "#ffffff" }));
    fpsCounter.x = 20;
    const updateFpsEveryNFrames = 10;
    const fpsRollingHistory: number[] = [];
    if ($states.debug.showFps) {
        debugContainer.addChild(fpsCounter);
    }

    const renderGraph = () => {
        $simulation = $states.simulation;
        $debug = $states.debug;
        $graphics = $states.graphics;
        $context = $states.context;
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
            fpsCounter.y = app.screen.height - 40;
        }

        $graphics.textContainer.alpha = zoom <= ZOOM_TEXT_INVISIBLE_THRESHOLD
            ? 0
            : zoom >= ZOOM_TEXT_VISIBLE_THRESHOLD
                ? 1
                : 1 - (ZOOM_TEXT_VISIBLE_THRESHOLD - zoom) /
                (ZOOM_TEXT_VISIBLE_THRESHOLD - ZOOM_TEXT_INVISIBLE_THRESHOLD);

        if ($graphics.overlaySettings !== undefined) handleOverlay(overlaySprite, $graphics);
        if ($graphics.backdropSettings !== undefined) handleBackdrop(backdropSprite, $graphics);

        // render thoughts on screen
        $graphics.floatingNodes && (displacementAngleRotation += 0.005);

        $context.renderedNodes
            .forEach(node => {

                // handle positions
                if ($graphics.floatingNodes) {
                    const angle = (node.x / 100 + node.y / 100);
                    node.renderDisplacement.x = Math.cos(angle + displacementAngleRotation) * 30;
                    node.renderDisplacement.y = Math.sin(angle + displacementAngleRotation) * 30;
                }
                // console.log(displacementX, displacementY);
                const viewportPos = $graphics.viewport.toViewportCoordinates({ x: node.x + node.renderDisplacement.x, y: node.y + node.renderDisplacement.y });
                handleNodeLoading(node, $graphics, viewportPos);

                if (!node.isOnScreen)
                    return;

                const scale = zoom * node.radius / SPRITE_TEXTURE_RADIUS;
                node.sprite?.setTransform(viewportPos.x, viewportPos.y, scale, scale);
                // handle dynamic effects
                // node.blinkingGraphics.alpha = $simulation.frame % 150 < 50
                //     ? 1 - ($simulation.frame % 50) / 50
                //     : 0;

                if (zoom >= ZOOM_TEXT_INVISIBLE_THRESHOLD){
                    if (node.shape != NodeShape.TextBox)
                        node.renderedText?.setTransform(viewportPos.x, viewportPos.y + (node.radius * (1 + NODE_BORDER_THICKNESS * 2)) * zoom);
                    else
                        node.renderedText?.setTransform(viewportPos.x, viewportPos.y + (node.radius * (NODE_BORDER_THICKNESS - 1)) * zoom, zoom, zoom);
                    
                }
            });

        $context.renderedEdges.forEach(edge => {
            const srcViewportCoors = $graphics.viewport.toViewportCoordinates(
                { x: edge.source.x + edge.source.renderDisplacement.x, y: edge.source.y + edge.source.renderDisplacement.y });
            const tgtViewportCoors = $graphics.viewport.toViewportCoordinates(
                { x: edge.target.x + edge.target.renderDisplacement.x, y: edge.target.y + edge.target.renderDisplacement.y });
            handleEdgeLoading(edge, $graphics, srcViewportCoors, tgtViewportCoors);
            if (!edge.isOnScreen || edge.type === EdgeType.None) return;
            if (!edge.isOnScreen)
                return;

            const dx = tgtViewportCoors.x - srcViewportCoors.x;
            const dy = tgtViewportCoors.y - srcViewportCoors.y;
            const length = Math.hypot(dx, dy);
            const scaleX = length / EDGE_SPRITE_LENGTH;
            const scaleY = edge.type === EdgeType.Tapered
                ? Math.max(1, Math.min(3, edge.source.radius / TAPERED_EDGE_WIDTH)) * zoom
                : zoom;
            const angle = Math.atan2(dy, dx);

            edge.sprite && edge.sprite.setTransform(srcViewportCoors.x, srcViewportCoors.y, scaleX, scaleY, angle);
            // (edge.sprite instanceof AnimatedSprite) && edge.sprite.update(1);
        })
    };

    renderGraph();

    return renderGraph;
}