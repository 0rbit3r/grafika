import {GraphData } from "./settings";

export interface GraphInstance {
    // data management
    addData: (data: GraphData) => void;
    removeData: (data: GraphData) => void;

    // Renders a single frame
    render: () => void;
    // Ticks the ticker one time
    tick: (frames: number) => void;

    // starts/stops the internal ticker (needed for panning, zooming, dragging etc.)
    start: () => void;
    stop: () => void;

    // starts/stops the force simulation    
    simStart: () => void;
    simStop: () => void;
}

export interface GraphCallbacks {
    onNodeSelected?: (id: number) => void;
    onNodeDragged?: (id: number, x: number, y: number) => void;
    onViewportMoved?: (x: number, y: number) => void;
    onViewportZoomed?: (zoom: number) => void;
    onNextFrame?: (frame: number) => void;
}