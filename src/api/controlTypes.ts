import { Emitter } from "mitt";
import { Data, GraphEdge, GraphNode } from "./dataTypes";
import { ProxyEdge } from "./proxyEdge";
import { ProxyNode } from "./proxyNode";
import { InteractionEvents } from "./events";

export interface GrafikaInstance {
    id: string;
    interactionEvents: Emitter<InteractionEvents>;
    
    // data management
    addData: (data: Data) => void;
    removeData: (data: Data) => void;
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

    //will move the viewport to follow either a given node, all data on screen or nothing when null
    focusOn: (what: GraphNode | ProxyNode | "all" | null) => void;
}

export interface DataProxy {
    nodes: ProxyNode[];
    edges: ProxyEdge[];
    unusedEdges: GraphEdge[];
}