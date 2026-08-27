import { Emitter } from "mitt";
import { Data, GraphEdge, GraphNode, XAndY } from "./dataTypes";
import { ProxyEdge } from "./proxyEdge";
import { ProxyNode } from "./proxyNode";
import { InteractionEvents } from "./events";

export interface GrafikaInstance {
    id: string;
    interactionEvents: Emitter<InteractionEvents>;

    // data management
    // Both resolve once the data has been fully processed (adds are drained from the
    // pending queue / removed nodes have finished fading out). Processing happens on
    // ticks, so the promises only settle while the ticker runs (or via tick());
    // dispose() settles anything still outstanding.
    addData: (data: Data) => Promise<void>;
    removeData: (data?: Data) => Promise<void>;
    getData: () => DataProxy;
    getViewport: () => { position: XAndY, zoom: number };
    setViewport: (viewport: Partial<{ position: XAndY, zoom: number }>) => void;

    // Renders a single frame
    render: () => void;
    // Ticks the ticker one time
    tick: (frames: number) => void;

    // starts/stops the internal ticker (needed for panning, zooming, dragging etc.)
    start: () => void;
    stop: () => void;
    dispose: () => Promise<void>;
    isDisposed: () => boolean;

    // starts/stops the force simulation    
    simStart: () => void;
    simStop: () => void;

    //will move the viewport to follow either a given node, all data on screen or nothing when null
    focusOn: (what: GraphNode | ProxyNode | "all" | null, padding?: number) => void;
}

export interface DataProxy {
    nodes: ProxyNode[];
    edges: ProxyEdge[];
    unusedEdges: GraphEdge[];
}