import { Graphics, Sprite } from "pixi.js";
import { RenderedNode } from "./renderedNode";
import { EdgeType, GraphEdgeInit } from "../api/dataTypes";
import { GraphStoresContainer } from "../state/storesContainer";
import { initEdgeGraphics } from "../graphics/initEdgeGraphics";

export interface RenderedEdge {
    source: RenderedNode;
    target: RenderedNode;
    color: string;
    type: EdgeType;
    weight: number;
    sprite: Sprite | null;

    isOnScreen: boolean;
}

export function initializeRenderedEdge(
    edge: GraphEdgeInit, sourceNode: RenderedNode, targetNode: RenderedNode,
    $states: GraphStoresContainer): RenderedEdge {
    const $graphics = $states.graphics.get();

    const renderedEdge: RenderedEdge = {
        source: sourceNode,
        target: targetNode,
        sprite: null,
        type: edge.type ?? $graphics.defaultEdgeType,
        weight: edge.weight ?? 1,
        color: edge.color ?? "#dddddd",
        isOnScreen: true
    };

    initEdgeGraphics(renderedEdge, $states);

    return renderedEdge;
}