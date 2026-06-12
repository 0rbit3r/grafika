import { Application, Container, TextStyle, Text, Sprite } from "pixi.js";
import { DRAG_Z, EDGES_Z, NODES_Z, TEXT_Z } from "./zIndexes";
import { GraphStoresContainer } from "../state/storesContainer";
import { EdgeType, NodeShape } from "../api/dataTypes";
import { NEW_NODE_FADE_IN_FRAMES, NEW_NODE_FADE_OUT_FRAMES, NEW_NODE_INVISIBLE_FOR, NODE_BORDER_THICKNESS, ZOOM_TEXT_INVISIBLE_THRESHOLD, ZOOM_TEXT_VISIBLE_THRESHOLD } from "../core/defaultGraphOptions";
import { initOverlay } from "./overlay/initOverlay";
import { NODE_SPRITE_RADIUS, invalidateNodeSpriteTextureCache } from "./sprites/nodeSprites";
import { EDGE_SPRITE_LENGTH, TAPERED_EDGE_WIDTH, invalidateEdgeSpriteTextureCache } from "./sprites/edgeSprites";
import { invalidateEffectTextureCache } from "./sprites/effectSprites";
import { handleOverlay } from "./overlay/handleOverlay";
import { handleNodeLoading, handleEdgeLoading } from "./dynamicLoader";
import { initBackdrop } from "./backdrop/initBackdrop";
import { handleBackdrop } from "./backdrop/handleBackdrop";
import { handleViewportFocus } from "./viewport/handleViewportFocus";

export const initGraphics = async (app: Application, $states: GraphStoresContainer) => {
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

    invalidateNodeSpriteTextureCache();
    invalidateEffectTextureCache();
    invalidateEdgeSpriteTextureCache();

    let $simulation = $states.simulation;
    let $debug = $states.debug;
    let $graphics = $states.graphics;
    let $context = $states.context;
    let zoom = 0;
    let displacementAngleRotation = 0;

    let overlaySprite: Sprite;
    if ($graphics.overlaySettings !== undefined) {
        overlaySprite = await initOverlay($graphics.overlaySettings.url);
        zSortedContainer.addChild(overlaySprite);
    }

    let backdropSprite: Sprite;
    if ($graphics.backdropSettings !== undefined) {
        backdropSprite = await initBackdrop($graphics.backdropSettings.url);
        zSortedContainer.addChild(backdropSprite);
    }


    zSortedContainer.sortChildren();

    const fpsCounter: Text = new Text({ text: '0', style: new TextStyle({ fontSize: 20, fill: "#ffffff" }) });
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

        handleViewportFocus($states);

        // FPS counter
        if ($debug.showFps) {
            const fps = $graphics.app.ticker.FPS;
            fpsRollingHistory.push(fps);
            if (fpsRollingHistory.length > updateFpsEveryNFrames)
                fpsRollingHistory.shift();
            if ($simulation.frame % updateFpsEveryNFrames === 0 && $simulation.frame >= 10) {
                fpsCounter.text = String(Math.floor(fpsRollingHistory.reduce((a, b) => a + b) / fpsRollingHistory.length));
            }
            fpsCounter.y = app.screen.height - 80;
        }

        $graphics.textContainer.alpha =
            zoom <= ZOOM_TEXT_INVISIBLE_THRESHOLD
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
                node.framesAlive += 1;
                if (node.framesAlive < 1) return;

                handleNodeLoading(node, $graphics);

                if ($graphics.floatingNodes && !node.held) {
                    const positionBasedAngle = (node.x / 100 + node.y / 100);
                    node.floatingDisplacement.x = Math.cos(positionBasedAngle + displacementAngleRotation) * 30;
                    node.floatingDisplacement.y = Math.sin(positionBasedAngle + displacementAngleRotation) * 30;
                }
                const viewportPos = $graphics.viewport.toViewportCoordinates({ x: node.x + node.floatingDisplacement.x, y: node.y + node.floatingDisplacement.y });

                // handle dynamic effects
                node.blinkEffect && node.blinkingSprite &&
                    (node.blinkingSprite.alpha = $simulation.frame % 333 < 111
                        ? Math.max(0, Math.pow((1 - ($simulation.frame % 111) / 111), 2))
                        : 0);
                if (!node.isLoadedOnScreen)
                    return;

                // handle scale and alpha based on time (fade effect) and zoom.
                const scale = zoom * node.radius / NODE_SPRITE_RADIUS;
                const fadeInFactor = Math.max(0, Math.min(1, (node.framesAlive - NEW_NODE_INVISIBLE_FOR) / NEW_NODE_FADE_IN_FRAMES));
                const fadeOutFactor = node.timeToLiveTo !== undefined
                    ? Math.max(0, Math.min(1, (node.timeToLiveTo - node.framesAlive) / NEW_NODE_FADE_OUT_FRAMES))
                    : 1;
                const timeAffectedScale = scale *
                    (node.framesAlive <= NEW_NODE_INVISIBLE_FOR ? 0.01 : fadeInFactor) * fadeOutFactor;
                if (node.sprite) {
                    node.sprite.position.set(viewportPos.x, viewportPos.y);
                    node.sprite.scale.set(timeAffectedScale, timeAffectedScale);
                }

                // handle text
                if (zoom >= ZOOM_TEXT_INVISIBLE_THRESHOLD) {
                    if (node.shape !== NodeShape.TextOnly && node.shape !== NodeShape.TextOnlyHighlighted) {
                        if (node.renderedText) node.renderedText.position.set(viewportPos.x, viewportPos.y + (node.radius * (1 + NODE_BORDER_THICKNESS * 2)) * zoom);
                    } else {
                        if (node.renderedText) {
                            node.renderedText.position.set(viewportPos.x, viewportPos.y);
                            node.renderedText.scale.set(zoom, zoom);
                        }
                    }
                    if (node.renderedText) {
                        node.renderedText.alpha = (node.shape === NodeShape.TextOnly || node.shape === NodeShape.TextOnlyHighlighted)
                            ? 1
                            : fadeInFactor * fadeOutFactor;
                    }
                }
            });

        $context.renderedEdges.forEach(edge => {
            const srcViewportCoors = $graphics.viewport.toViewportCoordinates(
                { x: edge.source.x + edge.source.floatingDisplacement.x, y: edge.source.y + edge.source.floatingDisplacement.y });
            const tgtViewportCoors = $graphics.viewport.toViewportCoordinates(
                { x: edge.target.x + edge.target.floatingDisplacement.x, y: edge.target.y + edge.target.floatingDisplacement.y });

            handleEdgeLoading(edge, $graphics, srcViewportCoors, tgtViewportCoors);

            if (!edge.isLoadedOnScreen || edge.type === EdgeType.None) return;

            const dx = tgtViewportCoors.x - srcViewportCoors.x;
            const dy = tgtViewportCoors.y - srcViewportCoors.y;
            const length = Math.hypot(dx, dy);
            const scaleX = length / EDGE_SPRITE_LENGTH;
            const scaleY = edge.type === EdgeType.Tapered
                ? Math.max(1, Math.min(3, edge.source.radius / TAPERED_EDGE_WIDTH)) * zoom
                : zoom;
            const angle = Math.atan2(dy, dx);

            if (edge.sprite) {
                edge.sprite.position.set(srcViewportCoors.x, srcViewportCoors.y);
                edge.sprite.scale.set(scaleX, scaleY);
                edge.sprite.rotation = angle;
            }

            const youngerNode = edge.source.framesAlive < edge.target.framesAlive
                ? edge.source
                : edge.target;
            const edgeFadeInFactor = Math.max(0, Math.min(1, (youngerNode.framesAlive - NEW_NODE_INVISIBLE_FOR) / NEW_NODE_FADE_IN_FRAMES));
            let edgeFadeOutFactor = 1;
            if (edge.source.timeToLiveTo !== undefined)
                edgeFadeOutFactor = Math.min(edgeFadeOutFactor, Math.max(0, Math.min(1, (edge.source.timeToLiveTo - edge.source.framesAlive) / NEW_NODE_FADE_OUT_FRAMES)));
            if (edge.target.timeToLiveTo !== undefined)
                edgeFadeOutFactor = Math.min(edgeFadeOutFactor, Math.max(0, Math.min(1, (edge.target.timeToLiveTo - edge.target.framesAlive) / NEW_NODE_FADE_OUT_FRAMES)));
            edge.sprite && (edge.sprite.alpha = edge.alpha * edgeFadeInFactor * edgeFadeOutFactor);
        })
    };

    renderGraph();

    return renderGraph;
}
