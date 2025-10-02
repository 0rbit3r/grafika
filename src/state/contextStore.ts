import { Data, Edge } from "../api/dataTypes";
import { RenderedNode } from "../core/renderedNode";
import { RenderedEdge } from "../core/renderedEdge";
import { ProxyNode } from "../api/proxyNode";
import { ProxyEdge } from "../api/proxyEdge";

export interface ContextStore {
    renderedNodes: RenderedNode[];
    renderedEdges: RenderedEdge[];

    edgesAdjacency: Map<number, Set<number>>;

    notRenderedEdges: Edge[]; // edges that are defined, but missing either source or target node

    proxyNodesList: ProxyNode[];
    proxyEdgesList: ProxyEdge[];

    proxyNodesMap: WeakMap<RenderedNode, ProxyNode>;
    proxyEdgesMap: WeakMap<RenderedEdge, ProxyEdge>;
}

export function createContextStore(): ContextStore {
    return {
        renderedNodes: [],
        renderedEdges: [],
        edgesAdjacency: new Map(),

        notRenderedEdges: [],

        proxyNodesList: [],
        proxyEdgesList: [],

        proxyEdgesMap: new WeakMap(),
        proxyNodesMap: new WeakMap(),
    };
}