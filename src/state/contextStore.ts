import { map } from "nanostores";
import { GraphEdge } from "../api/publicTypes";
import { RenderedNode } from "../core/renderedNode";
import { GraphData } from "../api/settings";
import { RenderedEdge } from "../core/renderedEdge";

export interface ContextStore{
    renderedNodes: RenderedNode[];
    renderedEdges: RenderedEdge[];
    notRenderedEdges: GraphEdge[]; // edges that are defined, but missing either source or target node
}

export const createContextStore = (data?: GraphData) =>
    map<ContextStore>({
        renderedNodes: [],
        renderedEdges: [],
        notRenderedEdges: []
    });