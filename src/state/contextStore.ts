import { map } from "nanostores";
import { GraphNode, NodeShape } from "../api/graphNode";
import { RenderedNode } from "../graphics/renderedNode";

export interface ContextStore{
    renderedNodes: RenderedNode[];
    // new nodes have been added, but not yet transformed into renderedNodes
    newNodes: GraphNode[];
}

export const createContextStore = (nodes?: GraphNode[]) =>
    map<ContextStore>({
        renderedNodes: [],
        newNodes: nodes ?? []
    });