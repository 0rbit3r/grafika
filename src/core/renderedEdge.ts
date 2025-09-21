import { Graphics, Sprite } from "pixi.js";
import { RenderedNode } from "./renderedNode";
import { EdgeType, EdgeInit } from "../api/dataTypes";
import { GraphStoresContainer } from "../state/storesContainer";
import { initEdgeGraphics } from "../graphics/initEdgeGraphics";
import { handleEdgeLoading } from "../graphics/dynamicLoader";

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
    edge: EdgeInit, sourceNode: RenderedNode, targetNode: RenderedNode,
    $states: GraphStoresContainer): RenderedEdge {
    const $graphics = $states.graphics.get();

    const renderedEdge: RenderedEdge = {
        source: sourceNode,
        target: targetNode,
        sprite: null,
        type: edge.type ?? $graphics.defaultEdgeType,
        weight: edge.weight ?? 1,
        color: edge.color ?? "#dddddd",
        isOnScreen: false
    };

    initEdgeGraphics(renderedEdge, $states);
    handleEdgeLoading(renderedEdge, $graphics);

    return renderedEdge;
}