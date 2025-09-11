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

    //interactivity
    edgeGraphics.eventMode = 'static';
    edgeGraphics.on('pointerdown', () => {
        if (!$graphics.app.ticker.started) return;
        $graphics.viewport.dragged = true;
        // useGraphStore.getState().setLockedOnHighlighted(false);       <---   cancels locked on highlight
    });

    edgeGraphics.on('pointerup', () => {
        $graphics.viewport.dragged = false;
    });

    edgeGraphics.on('pointerupoutside', () => {
        $graphics.viewport.dragged = false;
    });

    edgeGraphics.on('pointermove', (event) => {
        if ($graphics.viewport.dragged && $graphics.app.ticker.started) {
            $graphics.viewport.moveByZoomed({ x: event.movementX, y: event.movementY });

        }
        // else  if (event.type === 'touch'){
        //     const touchEvent = event.originalEvent.nativeEvent as PixiTouch;
        //     touchEvent.type
        // }
    });

    edgeGraphics.on('wheel', (e) => {
        if (!$graphics.app.ticker.started) return;
        $graphics.viewport.zoomByWheelDelta(-e.deltaY);
    });

    return renderedEdge;
}