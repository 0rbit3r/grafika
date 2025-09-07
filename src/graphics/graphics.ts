import { Application, Assets, Container, Graphics, Sprite, TextStyle, Text, DisplayObject } from "pixi.js";
import { addDraggableViewport } from "./viewport"
import { DEFAULT_RADIUS, BACKDROP_ZOOM_THRESHOLD_FULLY_VISIBLE, BACKDROP_ZOOM_THRESHOLD_HIDDEN, NEW_NODE_INVISIBLE_FOR, ZOOM_TEXT_VISIBLE_THRESHOLD, NEW_NODE_FADE_IN_FRAMES, GRAVITY_FREE_RADIUS, SIM_HEIGHT, THOUGHT_BORDER_THICKNESS } from "../core/defaultGraphOptions";
import { NODES_Z, TEXT_Z } from "./zIndexes";
import { GraphNode, NodeEffect, NodeShape as NodeShape } from "../api/graphNode";
import tinycolor from "tinycolor2";
import { GraphStoresContainer } from "../state/storesContainer";
import {RenderedNode} from "./renderedNode";
import {initializeRenderedNode} from "./renderedNode";

export const initGraphics = (app: Application, $state: GraphStoresContainer) => {
    app.stage.eventMode = 'static';
    const zSortedContainer = new Container();
    zSortedContainer.sortableChildren = true;
    app.stage.addChild(zSortedContainer);

    const nodeContainer = $state.graphics.get().nodeContainer;
    const textContainer = $state.graphics.get().textContainer;

    const viewport = $state.graphics.get().viewport;

    zSortedContainer.addChild(viewport.dragContainer);

    // nodeGraphics.sortableChildren = true;
    nodeContainer.zIndex = NODES_Z;

    zSortedContainer.addChild(nodeContainer);

    textContainer.zIndex = TEXT_Z;

    zSortedContainer.addChild(textContainer);

    //     const initializeGraphicsForEdge = (edge: RenderedEdge) => {

    //     }

    const fpsCounter: Text = new Text('0', new TextStyle({ fontSize: 20, fill: "#ffffff" }));
    fpsCounter.x = 20;
    fpsCounter.y = app.screen.height - 40;

    const renderTimeDeltas: number[] = [1];
    let lastRenderTime = performance.now();


    //     const backdropTexture = new Sprite();
    //     Assets.load(import.meta.env.VITE_PUBLIC_FOLDER + '/backdrop.png').then(t => { backdropTexture.texture = t });
    //     backdropTexture.width = 100;
    //     backdropTexture.height = 100;
    //     backdropTexture.position.set(- backdropTexture.width / 2, - backdropTexture.height / 2);

    //     backdropTexture.alpha = 1;
    //     backdropTexture.interactive = false;
    //     backdropTexture.hitArea = null;
    //     backdropTexture.zIndex = -1;
    // zSortedContainer.addChild(backdropTexture);

    zSortedContainer.sortChildren();

    const renderGraph = () => {
        const simState = $state.simulation.get();
        const settingsState = $state.debug.get();
        const graphicsState = $state.graphics.get();

        // clear textContainer
        textContainer.removeChildren();

        // FPS counter
        const computeEveryNFrames = 10;
        if (settingsState.showFps) {
            const currentTime = performance.now();
            if (simState.frame % computeEveryNFrames === 0 && simState.frame >= 10) {
                //compute FPS
                const averageDelta = renderTimeDeltas.reduce((acc, cur) => acc + cur, 0) / renderTimeDeltas.length;
                const fps = Math.round(1000 / averageDelta);
                fpsCounter.text = fps.toString();
            }

            renderTimeDeltas.push(currentTime - lastRenderTime);
            lastRenderTime = currentTime;

            if (renderTimeDeltas.length > computeEveryNFrames) {
                renderTimeDeltas.shift();
            }
            textContainer.addChild(fpsCounter);
        }


        //         const onScreenThoughts = getThoughtsOnScreen()
        //             .concat(graphState.fadeOutThoughts);

        //         const stateViewport = graphState.viewport;
        //         if (stateViewport === null) {
        //             return;
        //         }

        //         nodeContainer.clear();

        //         // nodeContainer.children.forEach(child => {
        //         //     if (child instanceof Graphics) {
        //         //         child.clear();
        //         //     }
        //         // });



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

        const $dataContext = $state.context.get();

        $dataContext.newNodes.forEach(n => {
            $dataContext.renderedNodes.push(
                initializeRenderedNode(n, $state)
            )
        });
        $state.context.setKey("newNodes", []);

        // render thoughts on screen
        $state.context.get().renderedNodes
            .forEach(node => {
                const pos = graphicsState.viewport.toViewportCoordinates({ x: node.x, y: node.y });
                node.graphics.setTransform(pos.x, pos.y, graphicsState.viewport.zoom, graphicsState.viewport.zoom);

                //             const graphControlsState = useGraphControlsStore.getState();

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

                //             // Render virtual edges when in profile mode
                //             // if (graphControlsState.explorationMode === ExplorationMode.PROFILE)
                //             //     thought.virtualLinks.forEach(referencedThoughtId => {
                //             //         const referencedThought = onScreenThoughts.filter(t => t.id == referencedThoughtId)[0];
                //             //         // handle dynamic edge appearance based on highlighted thought
                //             //         if (referencedThought) {
                //             //             // const arrowColor = highlightedThought === null
                //             //             //     ? referencedThought.color
                //             //             //     : highlightedThought === thought || highlightedThought === referencedThought
                //             //             //         ? tinycolor(referencedThought.color).lighten(5).toString()
                //             //             //         : tinycolor(referencedThought.color).darken(10).toString();
                //             //             // const arrowColor = referencedThought.color;
                //             //             const arrowThickness = UNHIGHLIGHTED_EDGE_WIDTH / 2;
                //             //             const arrowAlpha = UNHIGHLIGHTED_EDGE_ALPHA / 4;

                //             //             const sourceOpacity = Math.min(1, (thought.timeOnScreen - NEW_NODE_INVISIBLE_FOR) / NEW_NODE_FADE_IN_FRAMES);
                //             //             const targetOpacity = referencedThought.timeOnScreen <= NEW_NODE_INVISIBLE_FOR
                //             //                 ? 0
                //             //                 : Math.min(1, (referencedThought.timeOnScreen - NEW_NODE_INVISIBLE_FOR) / NEW_NODE_FADE_IN_FRAMES);

                //             //             const edgeOpacity = Math.min(sourceOpacity, targetOpacity, arrowAlpha);
                //             //             draw_edge(
                //             //                 nodeContainer,
                //             //                 stateViewport.toViewportCoordinates({ x: referencedThought.position.x, y: referencedThought.position.y }),
                //             //                 stateViewport.toViewportCoordinates({ x: thought.position.x, y: thought.position.y }),
                //             //                 "#ffffff", stateViewport.zoom, thought.radius, arrowThickness, edgeOpacity);
                //             //         }
                //             //     });
            });
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
