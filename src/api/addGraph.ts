import { Application } from "pixi.js";
import { initGraphics } from "../graphics/initGraphics";
import { GraphSettings } from "./settings";
import { createGraphStores } from "../state/storesContainer";
import { addData } from "../core/contextManager/addData";
import { removeDataByIds } from "../core/contextManager/removeData";
import { simulate_one_frame_of_FDL } from "../simulation/forcesSimulation";
import { GraphInstance } from "./controlTypes";
import { GraphDataInit } from "./dataTypes";
import mitt from "mitt";
import {type GraphInteractionEvents} from "./events";

export function addGraph(element: HTMLElement, settings: GraphSettings): GraphInstance {

    const app = new Application<HTMLCanvasElement>(
        {
            background: settings.graphics?.backgroundColor ?? '#000000',
            resizeTo: element,
            antialias: settings.graphics?.antialiasing ?? false,

            autoDensity: true, // todo: i have a hunch this might mess up drag containers relative size to viewport or other things,
            resolution: window.devicePixelRatio // this and the above are needed for the canvas not to look like shit on mobile
        }
    );

    element.appendChild(app.view as HTMLCanvasElement);

    const interactionEvents = mitt<GraphInteractionEvents>()

    const $states = createGraphStores(app, settings, interactionEvents);

    const renderGraph = initGraphics(app, $states);

    element.addEventListener("resize", _ =>
        setTimeout(() => $states.graphics.get().viewport.resizeHitArea(app.screen.width, app.screen.height), 100));

    addData($states, settings.data ?? { edges: [], nodes: [] });

    app.ticker.autoStart = false;

    // testProxy($states);

    const handleTick = () => {
        $states.simulation.setKey("frame", $states.simulation.get().frame + 1);

        // //move the viewport to the highlighted thought
        // const lockedOnHighlighted = graphState.lockedOnHighlighted;
        // if (lockedOnHighlighted && !controlsState.disableFollowHighlightedThought) {
        //     const highlightedThought = graphState.highlightedThought;
        //     const viewport = graphState.viewport;
        //     if (highlightedThought !== null) {
        //         const dx = viewport.position.x - highlightedThought.position.x;
        //         const dy = viewport.position.y - highlightedThought.position.y;
        //         // console.log(dx, dy, lockedOnHighlighted);
        //         const threshold = 10;
        //         if (Math.abs(dx) > threshold && Math.abs(dy) > threshold) {
        //             graphState.viewport.moveBy({ x: (dx - threshold) / 50, y: (dy - threshold) / 50 });
        //         }
        //         // const idealZoom = INITIAL_ZOOM - ((INITIAL_ZOOM) / (highlightedThought.radius / MAX_RADIUS));
        //         // const dz = idealZoom - viewport.zoom;
        //         // console.log(dz);
        //         // if (Math.abs(dz) > 0.1) {
        //         //     graphState.viewport.zoomByButtonDelta(Math.sign(dz));
        //         // }
        //     }
        // }

        // // force simulation
        if ($states.simulation.get().simulationEnabled) {
            simulate_one_frame_of_FDL($states);
        }

        // graphState.fadeOutThoughts.forEach(thought => {
        //     thought.timeOnScreen -= 2;
        // });
        // if (graphState.fadeOutThoughts.length > 0 && graphState.fadeOutThoughts[0].timeOnScreen < NEW_NODE_INVISIBLE_FOR) {
        //     graphState.setFadeOutThoughts([]);
        // }

        // // render the graph
        renderGraph();
        interactionEvents.emit("framePassed", $states.simulation.get().frame);
    }

    // main application loop
    app.ticker.add((_) => {
        handleTick();
    });

    return {
        interactionEvents: interactionEvents,

        addData: (data: GraphDataInit) => addData($states, data),
        removeData: (data: GraphDataInit) => removeDataByIds($states, data),
        getData: () => ({
            nodes: $states.context.get().proxyNodesList,
            edges: $states.context.get().proxyEdgesList,
            unusedEdges: $states.context.get().notRenderedEdges
        }),

        start: () => app.ticker.start(),
        stop: () => app.ticker.stop(),
        dispose: () => {
            app.destroy(true, { children: true, texture: true, baseTexture: true });
        },

        simStart: () => $states.simulation.setKey("simulationEnabled", true),
        simStop: () => $states.simulation.setKey("simulationEnabled", false),

        render: () => {
            renderGraph();
            app.renderer.render(app.stage);
        },
        tick: (frames: number) => {
            for (let i = 0; i <= frames; i++) handleTick();
            app.renderer.render(app.stage);
        }
    };
}
