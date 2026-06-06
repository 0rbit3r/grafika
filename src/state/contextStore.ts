import { Data, GraphEdge, GraphNode } from "../api/dataTypes";
import { RenderedNode } from "../core/renderedNode";
import { RenderedEdge } from "../core/renderedEdge";
import { ProxyNode } from "../api/proxyNode";
import { ProxyEdge } from "../api/proxyEdge";

export interface ContextStore {
    renderedNodes: Map<string, RenderedNode>;
    renderedEdges: Map<string, RenderedEdge>;

    notRenderedEdgesById: Map<string, GraphEdge>; // edges that are defined, but missing either source or target node
    notRenderedEdgesByNodeId: Map<string, Set<GraphEdge>>; // reverse index: nodeId → pending edges referencing that node

    pendingNodes: GraphNode[];
    pendingEdges: GraphEdge[];
    pendingAngle: number; // running angle for spiral initial placement

    proxyNodesMap: WeakMap<RenderedNode, ProxyNode>;
    proxyEdgesMap: WeakMap<RenderedEdge, ProxyEdge>;

    addTrackers: CompletionTracker[];    // fired when all nodes from an addData call are rendered
    removeTrackers: CompletionTracker[]; // fired when all nodes from a removeData call are destroyed
}

export function createContextStore(): ContextStore {
    return {
        renderedNodes: new Map(),
        renderedEdges: new Map(),

        notRenderedEdgesById: new Map(),
        notRenderedEdgesByNodeId: new Map(),

        pendingNodes: [],
        pendingEdges: [],
        pendingAngle: 0,

        proxyEdgesMap: new WeakMap(),
        proxyNodesMap: new WeakMap(),

        addTrackers: [],
        removeTrackers: [],
    };
}

// used for onFinished callbacks for adding/removing data
export interface CompletionTracker {
    pendingIds: Set<string>;
    callback: () => void;
}