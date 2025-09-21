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

    const resizeElementHandler = () => $states.graphics.get().viewport.resizeHitArea(app.screen.width, app.screen.height); //todo -removed callback - ensure it is not needed
    element.addEventListener("resize", resizeElementHandler);


    addData($states, settings.data ?? { edges: [], nodes: [] });

    app.ticker.autoStart = false;

    // testProxy($states);

    const handleTick = () => {
        $states.simulation.setKey("frame", $states.simulation.get().frame + 1);
        
        // force simulation
        if ($states.simulation.get().simulationEnabled) {
            simulate_one_frame_of_FDL($states);
        }

        // render the graph
        renderGraph();
        interactionEvents.emit("framePassed", $states.simulation.get().frame);
    }

    // main application loop
    app.ticker.add((_) => {
        handleTick();
    });

    const id = Math.floor(Math.random() * 10000); 
    console.log("initialized graph " + id.toString());

    return {
        id: id.toString(),
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
            element.removeEventListener("resize", resizeElementHandler);
            app.ticker.stop();
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
