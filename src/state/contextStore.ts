import { map } from "nanostores";
import { GraphDataInit, GraphEdgeInit } from "../api/dataTypes";
import { RenderedNode } from "../core/renderedNode";
import { RenderedEdge } from "../core/renderedEdge";
import { GraphProxyNode } from "../api/proxyNode";
import { GraphProxyEdge } from "../api/proxyEdge";

export interface ContextStore{
    renderedNodes: RenderedNode[];
    renderedEdges: RenderedEdge[];

    edgesAdjacency: Map<number, Set<number>>;

    notRenderedEdges: GraphEdgeInit[]; // edges that are defined, but missing either source or target node

    proxyNodesList: GraphProxyNode[];
    proxyEdgesList: GraphProxyEdge[];

    proxyNodesMap: WeakMap<RenderedNode, GraphProxyNode>;
    proxyEdgesMap: WeakMap<RenderedEdge, GraphProxyEdge>;


    heldNode?: RenderedNode;
}

export const createContextStore = () =>
    map<ContextStore>({
        renderedNodes: [],
        renderedEdges: [],
        edgesAdjacency: new Map(),
        
        notRenderedEdges: [],

        proxyNodesList: [],
        proxyEdgesList: [],

        proxyEdgesMap: new WeakMap(),
        proxyNodesMap: new WeakMap(),
    });