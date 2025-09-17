import { RenderedNode } from "../renderedNode";
import { GraphicsStore } from "../../state/graphicsStore";
import { RenderedEdge } from "../renderedEdge";

export const loadNode = (node: RenderedNode, $graphics: GraphicsStore) => {
    node.isLoaded = true;
    $graphics.nodeContainer.addChild(node.graphics);
}

export const unloadNode = (node: RenderedNode, $graphics: GraphicsStore) => {
    node.isLoaded = false;
    $graphics.nodeContainer.removeChild(node.graphics);
}

export const loadEdge = (edge: RenderedEdge, $graphics: GraphicsStore) => {
    edge.isLoaded = true;
    $graphics.edgeContainer.addChild(edge.graphics);
}

export const unloadEdge = (edge: RenderedEdge, $graphics: GraphicsStore) => {
    edge.isLoaded = false;
    $graphics.edgeContainer.removeChild(edge.graphics);
}