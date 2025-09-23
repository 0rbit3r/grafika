import { Application } from "pixi.js";
import { initGraphics } from "../graphics/initGraphics";
import { GrafikaSettings } from "./settings";
import { createGraphStores } from "../state/storesContainer";
import { addData } from "../core/contextManager/addData";
import { removeDataByIds } from "../core/contextManager/removeData";
import { simulate_one_frame_of_FDL } from "../simulation/forcesSimulation";
import { GrafikaInstance } from "./controlTypes";
import { DataInit } from "./dataTypes";
import mitt from "mitt";
import { type InteractionEvents } from "./events";
import { disposeState } from "../core/dispose";

export function addGrafika(element: HTMLElement, settings: GrafikaSettings): GrafikaInstance {

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

    const interactionEvents = mitt<InteractionEvents>()

    const $states = createGraphStores(app, settings, interactionEvents);

    const renderGraph = initGraphics(app, $states);

    const resizeObserver = new ResizeObserver((entries => {
        for (const entry of entries) {
            if (entry.contentBoxSize) {
                console.log("resizing grafika");
                app.screen.width = entry.contentRect.width;
                app.screen.height = entry.contentRect.height;
                app.queueResize();
                $states.graphics.viewport.resizeHitArea(app.screen.width, app.screen.height)
            }
        }
    }));
    resizeObserver.observe(element);


    addData($states, settings.data ?? { edges: [], nodes: [] });

    app.ticker.autoStart = false;

    // testProxy($states);

    const handleTick = () => {
        $states.simulation.frame = $states.simulation.frame + 1;
        // force simulation
        if ($states.simulation.simulationEnabled) {
            simulate_one_frame_of_FDL($states);
        }

        // render the graph
        renderGraph();
        interactionEvents.emit("framePassed", $states.simulation.frame);
    }

    // main application loop
    app.ticker.add((_) => {
        handleTick();
    });

    const id = Math.floor(Math.random() * 10000);
    console.log("initialized grafika instance " + id.toString());
    let isDisposed = false;

    return {
        id: id.toString(),
        interactionEvents: interactionEvents,

        addData: (data: DataInit) => { if (!isDisposed) addData($states, data) },
        removeData: (data: DataInit) => { if (!isDisposed) removeDataByIds($states, data) },
        getData: () => {
            if (isDisposed) return { edges: [], nodes: [], unusedEdges: [] };
            return {
                nodes: $states.context.proxyNodesList,
                edges: $states.context.proxyEdgesList,
                unusedEdges: $states.context.notRenderedEdges
            }
        },

        start: () => { if (!isDisposed) app.ticker.start() },
        stop: () => { if (!isDisposed) app.ticker.stop() },
        dispose: () => {
            if (isDisposed) return;
            isDisposed = true;
            console.log(`disposing grafika instance ${id}`);
            resizeObserver.disconnect();
            app.ticker.stop();

            disposeState($states);
        },
        isDisposed: () => isDisposed,

        simStart: () => { if (!isDisposed) $states.simulation.simulationEnabled = true },
        simStop: () => { if (!isDisposed) $states.simulation.simulationEnabled = false },

        render: () => {
            if (isDisposed) return;
            renderGraph();
            app.renderer.render(app.stage);
        },
        tick: (frames: number) => {
            if (isDisposed) return;
            for (let i = 0; i <= frames; i++) handleTick();
            app.renderer.render(app.stage);
        }
    };
}
