import { Emitter } from "mitt";
import { DataInit, EdgeInit } from "./dataTypes";
import { ProxyEdge } from "./proxyEdge";
import { ProxyNode } from "./proxyNode";
import { InteractionEvents } from "./events";

export interface GrafikaInstance {
    id: string;
    interactionEvents: Emitter<InteractionEvents>;
    
    // data management
    addData: (data: DataInit) => void;
    removeData: (data: DataInit) => void;
    getData: () => DataProxy;
    
    // Renders a single frame
    render: () => void;
    // Ticks the ticker one time
    tick: (frames: number) => void;
    
    // starts/stops the internal ticker (needed for panning, zooming, dragging etc.)
    start: () => void;
    stop: () => void;
    dispose: () => void;
    isDisposed: () => boolean;

    // starts/stops the force simulation    
    simStart: () => void;
    simStop: () => void;
}

export interface DataProxy {
    nodes: ProxyNode[];
    edges: ProxyEdge[];
    unusedEdges: EdgeInit[];
}