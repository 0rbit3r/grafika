import { map } from "nanostores";
import { GraphData, GraphEdge } from "../api/dataTypes";
import { RenderedNode } from "../core/renderedNode";
import { RenderedEdge } from "../core/renderedEdge";

export interface ContextStore{
    renderedNodes: RenderedNode[];
    renderedEdges: RenderedEdge[];
    notRenderedEdges: GraphEdge[]; // edges that are defined, but missing either source or target node
}

export const createContextStore = () =>
    map<ContextStore>({
        renderedNodes: [],
        renderedEdges: [],
        notRenderedEdges: []
    });