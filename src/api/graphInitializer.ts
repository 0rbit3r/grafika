import { Application } from "pixi.js";
import { initGraphics } from "../graphics/graphics";
import { GraphNode, NodeShape } from "./graphNode";
import {GraphSettings} from "./settings";
import {createGraphStores} from "../state/storesContainer"



export interface GraphInstance {
    render: () => void;

    setNodes: (data: GraphNode[]) => void;
    addNodes: (data: GraphNode[]) => void;
    removeNodes: (ids: number[]) => void;
    // setSimParams: (parameters: any) => void;;

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
            background: '#000000',
            resizeTo: element,
            antialias: settings.graphics?.antialiasing ?? false
        }
    );

    element.appendChild(app.view as HTMLCanvasElement);

    const $state = createGraphStores(app, settings);

    const renderGraph = initGraphics(app, $state);


    app.ticker.stop();

    // main application loop
    app.ticker.add((_) => {
        $state.simulation.setKey("frame", $state.simulation.get().frame + 1);

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
        //     simulate_one_frame_of_FDL();
        // }

        // graphState.fadeOutThoughts.forEach(thought => {
        //     thought.timeOnScreen -= 2;
        // });
        // if (graphState.fadeOutThoughts.length > 0 && graphState.fadeOutThoughts[0].timeOnScreen < NEW_NODE_INVISIBLE_FOR) {
        //     graphState.setFadeOutThoughts([]);
        // }

        // // render the graph
        renderGraph();
        if (hooks.onNextFrame) hooks.onNextFrame($state.simulation.get().frame);
    });

    return {
        simStart: () => app.ticker.start(),
        simStop: () => app.ticker.stop(),

        render: () => {
            renderGraph();
            app.renderer.render(app.stage);
        },
        addNodes: () => { },
        removeNodes: () => { },
        setNodes: () => { }
    };
}