import { Application } from "pixi.js";
import { initGraphics } from "../graphics/initGraphics";
import { GraphNode, NodeShape } from "./publicTypes";
import {GraphData, GraphSettings} from "./settings";
import {createGraphStores} from "../state/storesContainer";
import {addData} from "../core/contextManager/addData";
import {simulate_one_frame_of_FDL} from "../simulation/forcesSimulation";


export interface GraphInstance {
    // data management
    addData: (data: GraphData) => void;
    removeData: (data: GraphData) => void;

    // Renders a single frame
    render: () => void;
    // Ticks the ticker one time
    tick: () => void;

    // starts/stops the internal ticker (needed for panning, zooming, dragging etc.)
    start: () => void;
    stop: () => void;

    // starts/stops the force simulation    
    simStart: () => void;
    simStop: () => void;
}

export interface GraphCallbacks {
    onNodeSelected?: (id: number) => void;
    onNodeDragged?: (x: number, y: number) => void;
    onViewportMoved?: (x: number, y: number) => void;
    onViewportZoom?: (zoom: number) => void;
    onNextFrame?: (frame: number) => void;
}

export function addGraph(element: HTMLElement, settings: GraphSettings, hooks: GraphCallbacks): GraphInstance {

    const app = new Application<HTMLCanvasElement>(
        {
            background: settings.graphics?.backgroundColor ?? '#000000',
            resizeTo: element,
            antialias: settings.graphics?.antialiasing ?? false
        }
    );

    element.appendChild(app.view as HTMLCanvasElement);

    const $states = createGraphStores(app, settings);

    const renderGraph = initGraphics(app, $states);

    addData($states, settings.data ?? {edges: [], nodes: []});

    app.ticker.stop();

    const handleTick = () => {
        $states.simulation.setKey("frame", $states.simulation.get().frame + 1);

        // const graphState = useGraphStore.getState();
        // const controlsState = useGraphControlsStore.getState();



        // // handle zoom input from user
        // const zoomingControl = graphState.zoomingControl;
        // if (zoomingControl !== 0) {
        //     graphState.viewport.zoomByButtonDelta(zoomingControl);
        // }

        // // handle TimeShift  control input from user
        // const timeShiftControl = graphState.timeShiftControl;
        // const timeShift = graphState.timeShift;
        // const maxThoughtsOnScreen = controlsState.thoughtsOnScreenLimit;

        // if ((timeShiftControl > 0 && timeShift < graphState.temporalRenderedThoughts.length)
        //     || (timeShiftControl < 0 && timeShift > -maxThoughtsOnScreen)) { //todo check the one
        //     graphState.setTimeShift(timeShift + timeShiftControl);
        //     graphState.setFrame(1);
        // }

        // // Update temporal thoughts
        // handleTemporalThoughtsTimeShifting();

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
        // const frame = graphState.frame;
        // if (frame < SIMULATION_FRAMES) {
            simulate_one_frame_of_FDL($states);
        // }

        // graphState.fadeOutThoughts.forEach(thought => {
        //     thought.timeOnScreen -= 2;
        // });
        // if (graphState.fadeOutThoughts.length > 0 && graphState.fadeOutThoughts[0].timeOnScreen < NEW_NODE_INVISIBLE_FOR) {
        //     graphState.setFadeOutThoughts([]);
        // }

        // // render the graph
        renderGraph();
        if (hooks.onNextFrame) hooks.onNextFrame($states.simulation.get().frame);
    }

    // main application loop
    app.ticker.add((_) => {
        handleTick();
    });

    return {
        addData: (data: GraphData) => addData($states, data),
        removeData: () => { },

        start: () => app.ticker.start(),
        stop: () => app.ticker.stop(),

        simStart: () => $states.simulation.setKey("simulationEnabled", true),  
        simStop: () => $states.simulation.setKey("simulationEnabled", false),

        render: () => {
            renderGraph();
            app.renderer.render(app.stage);
        },
        tick: () => handleTick()
    };
}