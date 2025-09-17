import { Graphics } from "pixi.js";
import { RenderedNode } from "./renderedNode";
import { EdgeType, GraphEdgeInit } from "../api/dataTypes";
import { GraphStoresContainer } from "../state/storesContainer";
import { drawEdge } from "../graphics/drawEdge";
import { loadEdge } from "./contextManager/dynamicLoader";

export interface RenderedEdge {
    source: RenderedNode;
    target: RenderedNode;
    color: string;
    type: EdgeType;
    weight: number;
    graphics: Graphics;

    isLoaded: boolean;
}

export function initializeRenderedEdge(
    edge: GraphEdgeInit, sourceNode: RenderedNode, targetNode: RenderedNode,
    $states: GraphStoresContainer): RenderedEdge {

    const $graphics = $states.graphics.get();

    const edgeGraphics = new Graphics();

    const renderedEdge: RenderedEdge = {
        source: sourceNode,
        target: targetNode,
        graphics: edgeGraphics,
        type: edge.type ?? $graphics.defaultEdgeType,
        weight: edge.weight ?? 1,
        color: edge.color ?? "#dddddd",
        isLoaded: true
    };
    drawEdge(renderedEdge, $states);
    loadEdge(renderedEdge, $graphics);

    return renderedEdge;
}