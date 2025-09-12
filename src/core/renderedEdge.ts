import { Graphics } from "pixi.js";
import { RenderedNode } from "./renderedNode";
import { EdgeType, GraphEdge } from "../api/dataTypes";
import { GraphStoresContainer } from "../state/storesContainer";
import { drawEdge } from "../graphics/drawEdge";

export interface RenderedEdge {
    source: RenderedNode;
    target: RenderedNode;
    color: string;
    type: EdgeType;
    weight: number;
    graphics: Graphics;
}

export function initializeRenderedEdge(
    edge: GraphEdge, sourceNode: RenderedNode, targetNode: RenderedNode,
    $states: GraphStoresContainer): RenderedEdge {

    const $graphics = $states.graphics.get();

    const edgeGraphics = new Graphics();
    $graphics.edgeContainer.addChild(edgeGraphics);

    const renderedEdge: RenderedEdge = {
        source: sourceNode,
        target: targetNode,
        graphics: edgeGraphics,
        type: edge.type ?? EdgeType.Line,
        weight: edge.weight ?? 1,
        color: edge.color ?? "#dddddd"
    };
    drawEdge(renderedEdge, $states);

    return renderedEdge;
}