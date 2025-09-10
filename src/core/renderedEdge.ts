import { Graphics } from "pixi.js";
import { RenderedNode } from "./renderedNode";
import { EdgeType, GraphEdge } from "../api/publicTypes";
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


    const edgeGraphics = new Graphics();
    $states.graphics.get().edgeContainer.addChild(edgeGraphics);

    const renderedEdge: RenderedEdge = {
        source: sourceNode,
        target: targetNode,
        graphics: edgeGraphics,
        type: edge.type ?? EdgeType.Line,
        weight: edge.weight ?? 1,
        color: edge.color ?? "#dddddd"
    };
    drawEdge(renderedEdge, $states);

    //interactivity
    edgeGraphics.eventMode = 'static';
    edgeGraphics.on('wheel', (e) => {
        $states.graphics.get().viewport.zoomByWheelDelta(-e.deltaY);
    });

    return renderedEdge;
}