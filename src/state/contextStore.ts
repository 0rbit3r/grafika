import { Data, GraphEdge, GraphNode } from "../api/dataTypes";
import { RenderedNode } from "../core/renderedNode";
import { RenderedEdge } from "../core/renderedEdge";
import { ProxyNode } from "../api/proxyNode";
import { ProxyEdge } from "../api/proxyEdge";

export interface ContextStore {
    renderedNodes: RenderedNode[];
    renderedEdges: RenderedEdge[];

    nodesById: Map<string, RenderedNode>;
    edgesById: Map<string, RenderedEdge>;

    notRenderedEdgesById: Map<string, GraphEdge>; // edges that are defined, but missing either source or target node

    pendingNodes: GraphNode[];
    pendingEdges: GraphEdge[];
    pendingAngle: number; // running angle for spiral initial placement

    proxyNodesMap: WeakMap<RenderedNode, ProxyNode>;
    proxyEdgesMap: WeakMap<RenderedEdge, ProxyEdge>;
}

export function createContextStore(): ContextStore {
    return {
        renderedNodes: [],
        renderedEdges: [],

        nodesById: new Map(),
        edgesById: new Map(),

        notRenderedEdgesById: new Map(),

        pendingNodes: [],
        pendingEdges: [],
        pendingAngle: 0,

        proxyEdgesMap: new WeakMap(),
        proxyNodesMap: new WeakMap(),
    };
}