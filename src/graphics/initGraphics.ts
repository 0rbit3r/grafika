import { Application, Container, TextStyle, Text } from "pixi.js";
import { DRAG_Z, EDGES_Z, NODES_Z, TEXT_Z } from "./zIndexes";
import { GraphStoresContainer } from "../state/storesContainer";
import { EdgeType } from "../api/dataTypes";
import { BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE, BACKDROP_ZOOM_THRESHOLD_HIDDEN, ZOOM_TEXT_INVISIBLE_THRESHOLD, ZOOM_TEXT_VISIBLE_THRESHOLD } from "../core/defaultGraphOptions";
import {initBackdrop } from "./initBackdrop";

export const initGraphics = (app: Application, $states: GraphStoresContainer) => {
    app.stage.eventMode = 'static';
    const zSortedContainer = new Container();
    zSortedContainer.sortableChildren = true;
    app.stage.addChild(zSortedContainer);

    const nodeContainer = $states.graphics.get().nodeContainer;
    const textContainer = $states.graphics.get().textContainer;
    textContainer.eventMode = "none";

    const edgeContainer = $states.graphics.get().edgeContainer;

    const viewport = $states.graphics.get().viewport;

    zSortedContainer.addChild(viewport.dragContainer);

    // nodeGraphics.sortableChildren = true;
    viewport.dragContainer.zIndex = DRAG_Z;
    nodeContainer.zIndex = NODES_Z;
    textContainer.zIndex = TEXT_Z;
    edgeContainer.zIndex = EDGES_Z;

    zSortedContainer.addChild(nodeContainer);
    zSortedContainer.addChild(textContainer);
    zSortedContainer.addChild(edgeContainer);

    const backdropUrl = "/backdrop.png";

    const backdrop = initBackdrop(backdropUrl);
    zSortedContainer.addChild(backdrop);

    zSortedContainer.sortChildren();

    const fpsCounter: Text = new Text('0', new TextStyle({ fontSize: 20, fill: "#ffffff" }));
    fpsCounter.x = 20;
    fpsCounter.y = app.screen.height - 40;
    const updateFpsEveryNFrames = 10;
    const fpsRollingHistory: number[] = [];
    if ($states.debug.get().showFps) {
        textContainer.addChild(fpsCounter);
    }

    const renderGraph = () => {
        const $simulation = $states.simulation.get();
        const $debug = $states.debug.get();
        const $graphics = $states.graphics.get();
        const $context = $states.context.get();

        // FPS counter
        if ($debug.showFps) {
            const fps = $graphics.app.ticker.FPS;
            fpsRollingHistory.push(fps);
            if (fpsRollingHistory.length > updateFpsEveryNFrames)
                fpsRollingHistory.shift();
            if ($simulation.frame % updateFpsEveryNFrames === 0 && $simulation.frame >= 10) {
                fpsCounter.text = Math.floor(fpsRollingHistory.reduce((a, b) => a+b) / fpsRollingHistory.length);
            }
        }

        // if (backdrop !== undefined) {

        //     // BACKDROP
        //     const sizeOnScreen = 27.75 * $graphics.viewport.zoom;
        //     const onScreenCoors = $graphics.viewport.toViewportCoordinates(
        //         { x: -41600, y: -41600 }
        //     );

        //     backdrop.setTransform(
        //         onScreenCoors.x, onScreenCoors.y,
        //         sizeOnScreen, sizeOnScreen);
        //     const backdropOpacity =
        //         1 - Math.min(1, Math.max(0, $graphics.viewport.zoom - BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE)
        //             / (BACKDROP_ZOOM_THRESHOLD_HIDDEN - BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE));

        //     backdrop.alpha = 0.5;//backdropOpacity;

        //     nodeContainer.alpha = 0.5; //1 - backdropOpacity;
        //     textContainer.alpha = nodeContainer.alpha;
        //     edgeContainer.alpha = nodeContainer.alpha;
        // }

        //         // BACKDROP
        //         const sizeOnScreen = 27.75 * graphState.viewport.zoom;
        //         const onScreenCoors = graphState.viewport.toViewportCoordinates(
        //             { x: -41600, y: -41600 }
        //         );

        //         backdropTexture.setTransform(
        //             onScreenCoors.x, onScreenCoors.y,
        //             sizeOnScreen, sizeOnScreen);

        //         const backdropOpacity = 1 - Math.min(1, Math.max(0, graphState.viewport.zoom - BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE)
        //             / (BACKDROP_ZOOM_THRESHOLD_HIDDEN - BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE));

        //         backdropTexture.alpha = 0//backdropOpacity;

        //         nodeContainer.alpha = 1// - backdropOpacity;

        //         if (false)//graphState.viewport.zoom < BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE)
        //             graphState.temporalRenderedThoughts.concat(graphState.neighborhoodThoughts)
        //                 .forEach(t => {
        //                     if (!onScreenThoughts.includes(t))
        //                         t.graphics?.setTransform(0, 0, 0.01, 0.01);
        //                 });

        //         const thoughtsToRedraw = graphState.popThoughtsForRedraw();
        //         thoughtsToRedraw.forEach(t => {
        //             initializeGraphicsForThought(t);
        //         })

        // render thoughts on screen
        $context.renderedNodes
            .forEach(node => {
                // handle positions
                const pos = $graphics.viewport.toViewportCoordinates({ x: node.x, y: node.y });
                node.graphics.setTransform(pos.x, pos.y, $graphics.viewport.zoom, $graphics.viewport.zoom);

                // handle dynamic effects
                node.blinkingGraphics.alpha = $simulation.frame % 150 < 50
                    ? 1 - ($simulation.frame % 50) / 50
                    : 0;

                node.text.setTransform(pos.x - node.text.width / 2, pos.y + node.radius * 1.1 * $graphics.viewport.zoom);
                node.text.alpha = $graphics.viewport.zoom <= ZOOM_TEXT_INVISIBLE_THRESHOLD
                    ? 0
                    : $graphics.viewport.zoom >= ZOOM_TEXT_VISIBLE_THRESHOLD
                        ? 1
                        : 1 -(ZOOM_TEXT_VISIBLE_THRESHOLD - $graphics.viewport.zoom) /
                            (ZOOM_TEXT_VISIBLE_THRESHOLD - ZOOM_TEXT_INVISIBLE_THRESHOLD);

                //graphState.frame % 150 < 50
                //lighten(30 - (graphState.frame % 50) / 50 * 30)

                //             const text = thought.text as Text;
                //             // console.log(graphState.viewport.zoom, ZOOM_TEXT_VISIBLE_THRESHOLD);
                //             if ((graphState.viewport.zoom > graphControlsState.titleVisibilityThresholdMultiplier * ZOOM_TEXT_VISIBLE_THRESHOLD && thought.timeOnScreen > NEW_NODE_INVISIBLE_FOR)
                //                 || (thought.hovered && graphControlsState.titleOnHoverEnabled)) {

                //                 const textCoors = graphState.viewport.toViewportCoordinates({
                //                     x: thought.position.x,
                //                     y: thought.position.y + thought.radius
                //                 });
                //                 textCoors.y += (graphControlsState.titleOnHoverEnabled && graphState.viewport.zoom <= ZOOM_TEXT_VISIBLE_THRESHOLD ? 20 : 5);
                //                 textCoors.x -= text.width / 2;
                //                 text.x = textCoors.x;
                //                 text.y = textCoors.y;
                //                 text.alpha = Math.min(1, (thought.timeOnScreen - NEW_NODE_INVISIBLE_FOR) / NEW_NODE_FADE_IN_FRAMES);

                //                 textContainer.addChild(text);
                //             }


            });

        $context.renderedEdges.forEach(edge => {
            if (edge.type === EdgeType.None) return;
            const src = $graphics.viewport.toViewportCoordinates({ x: edge.source.x, y: edge.source.y });
            const tgt = $graphics.viewport.toViewportCoordinates({ x: edge.target.x, y: edge.target.y });

            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const length = Math.hypot(dx, dy);         // length in viewport (pixels)
            const scaleX = length / 1000;              // base line is 1000 units long
            const angle = Math.atan2(dy, dx);          // radians

            // NOTE: scaleY = 1 keeps the stroke thickness constant in screen pixels
            edge.graphics.setTransform(src.x, src.y, scaleX, $graphics.viewport.zoom, angle);
            // const pos = graphicsState.viewport.toViewportCoordinates({ x: edge.source.x, y: edge.source.y });
            // edge.graphics.setTransform(pos.x, pos.y, graphicsState.viewport.zoom, graphicsState.viewport.zoom)
        })
        //         // lastZoom = graphState.viewport.zoom;

        //         // boundaries
        //         nodeContainer.lineStyle(2, graphState.userSettings.color, 1);
        //         if (!graphControlsState.strongerPushForce) {
        //             // nodeContainer.drawRect(
        //             //     stateViewport.toViewportCoordinates({ x: 0, y: 0 }).x,
        //             //     stateViewport.toViewportCoordinates({ x: 0, y: 0 }).y,
        //             //     SIM_WIDTH * stateViewport.zoom,
        //             //     SIM_HEIGHT * stateViewport.zoom
        //             // );

        //             nodeContainer.drawCircle(
        //                 stateViewport.toViewportCoordinates({ x: 0, y: 0 }).x,
        //                 stateViewport.toViewportCoordinates({ x: 0, y: 0 }).y,
        //                 GRAVITY_FREE_RADIUS * graphState.viewport.zoom)
        //         } else {
        //             const CROSS_SIZE = SIM_HEIGHT / 100;
        //             const pointAbove = stateViewport.toViewportCoordinates({ x: 0, y: 0 - CROSS_SIZE });
        //             const pointBelow = stateViewport.toViewportCoordinates({ x: 0, y: 0 + CROSS_SIZE });
        //             const pointLeft = stateViewport.toViewportCoordinates({ x: 0 - CROSS_SIZE, y: 0 });
        //             const pointRight = stateViewport.toViewportCoordinates({ x: 0 + CROSS_SIZE, y: 0 });
        //             nodeContainer.moveTo(pointAbove.x, pointAbove.y);
        //             nodeContainer.lineTo(pointBelow.x, pointBelow.y);
        //             nodeContainer.moveTo(pointLeft.x, pointLeft.y);
        //             nodeContainer.lineTo(pointRight.x, pointRight.y);
        // }
    };

    renderGraph();

    return renderGraph;
}
