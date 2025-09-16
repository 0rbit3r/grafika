import { Emitter } from "mitt";
import { EdgeType, GraphDataInit, GraphEdgeInit } from "./dataTypes";
import { GraphProxyEdge } from "./proxyEdge";
import { GraphProxyNode } from "./proxyNode";
import { GraphInteractionEvents } from "./events";

export interface GraphInstance {
    interactionEvents: Emitter<GraphInteractionEvents>;

    // data management
    addData: (data: GraphDataInit) => void;
    removeData: (data: GraphDataInit) => void;
    getData: () => GraphDataProxy;

    // Renders a single frame
    render: () => void;
    // Ticks the ticker one time
    tick: (frames: number) => void;

    // starts/stops the internal ticker (needed for panning, zooming, dragging etc.)
    start: () => void;
    stop: () => void;
    dispose: () => void;

    // starts/stops the force simulation    
    simStart: () => void;
    simStop: () => void;
}

export interface GraphDataProxy {
    nodes: GraphProxyNode[];
    edges: GraphProxyEdge[];
    unusedEdges: GraphEdgeInit[];
}