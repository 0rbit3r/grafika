import { Sprite } from "pixi.js";
import { RenderedNode } from "./renderedNode";
import { EdgeType, Edge } from "../api/dataTypes";
import { GraphStoresContainer } from "../state/storesContainer";
import { initEdgeGraphics } from "../graphics/initEdgeGraphics";
import { handleEdgeLoading } from "../graphics/dynamicLoader";

export interface RenderedEdge {
    source: RenderedNode;
    target: RenderedNode;
    color: string;
    type: EdgeType;
    sprite: Sprite | null;

    isOnScreen: boolean;

    weight: number;
    alpha: number;
    length: number;
}

export function initializeRenderedEdge(
    edge: Edge, sourceNode: RenderedNode, targetNode: RenderedNode,
    $states: GraphStoresContainer): RenderedEdge {
    const $graphics = $states.graphics;

    const renderedEdge: RenderedEdge = {
        source: sourceNode,
        target: targetNode,
        sprite: null,
        type: edge.type ?? $graphics.defaultEdgeType,
        color: edge.color ?? ($graphics.defaultEdgeColor === "source"
            ? sourceNode.color
            : $graphics.defaultEdgeColor === "target"
                ? targetNode.color
                : $graphics.defaultEdgeColor),
        weight: edge.weight ?? 1,
        alpha: edge.alpha ?? $states.graphics.defaultEdgeAlpha,
        length: edge.length ?? $states.simulation.defaultEdgeLength,
        isOnScreen: false
    };

    initEdgeGraphics(renderedEdge, $states);
    handleEdgeLoading(renderedEdge, $graphics);

    return renderedEdge;
}