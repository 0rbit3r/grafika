import { RenderedEdge } from "../core/renderedEdge";
import {NodeShape, NodeEffect, GraphNode} from "../api/publicTypes";
import {Container, Graphics, TextStyle, Text} from "pixi.js";
import { DEFAULT_RADIUS, THOUGHT_BORDER_THICKNESS } from "../core/defaultGraphOptions";
import { GraphStoresContainer } from "../state/storesContainer";
import { TEXT_Z } from "../graphics/zIndexes";
import {drawNode} from "../graphics/drawNode";
import { XAndY } from "./innerTypes";

export interface RenderedNode {
    id: number;
    edges: RenderedEdge[];

    x: number;
    y: number;
    title: string;
    color: string;
    shape: NodeShape;
    effects: NodeEffect[];

    graphics: Graphics;
    text: Text; 
    radius: number;
    
    held: boolean;
    hovered: boolean;
    dragged: boolean;
    
    // counts the number of frames since the node appeared
    framesAlive: number;

    forces: XAndY;
    momentum: XAndY;
    
    // redraw the sprite when dirty
    dirty: boolean;
}

// Will initialize graphics and put it in the nodeContainer
export const initializeRenderedNode = (node: GraphNode, $states: GraphStoresContainer) => {
    const nodeGraphics = new Graphics();
    $states.graphics.get().nodeContainer.addChild(nodeGraphics);

    const renderedNode: RenderedNode = {
        id: node.id,
        shape: node.shape ?? NodeShape.Circle,
        title: node.title ?? node.id.toString(),
        x: node.x ?? Math.random() * 2 - 1,
        y: node.y ?? Math.random() * 2 -1,
        color: node.color ?? "#dddddd",
        effects: node.effects ?? [],
        edges: [],

        graphics: nodeGraphics,
        radius: node.radius ?? DEFAULT_RADIUS,
        text: null!,
        held: false,
        hovered: false,
        dirty: false,
        dragged: false,
        framesAlive: 0,
        forces: {x: 0, y: 0},
        momentum: {x: 0, y: 0}
    };
    drawNode(renderedNode, $states);

    //interactivity
    nodeGraphics.eventMode = 'static';
    nodeGraphics.cursor = 'pointer';

    let holdStartTime = 0;

    nodeGraphics.on('globalpointermove', e => {
        if (renderedNode.held) {
            const zoom = $states.graphics.get().viewport.zoom;
            renderedNode.x += e.movementX / zoom;
            renderedNode.y += e.movementY / zoom;
            // console.log(renderedNode.x, renderedNode.graphics.x);
        }
    });

    nodeGraphics.on('pointerdown', () => {
        $states.simulation.setKey("frame", 0);
        renderedNode.held = true;
        holdStartTime = performance.now();
    });

    nodeGraphics.on('pointerover', () => {
        renderedNode.hovered = true;
    });
    nodeGraphics.on('pointerout', () => {
        renderedNode.hovered = false;
    });
    nodeGraphics.on('pointerupoutside', () => {
        renderedNode.held = false;
        renderedNode.hovered = false;
    });
    nodeGraphics.on('wheel', (e) => {
        $states.graphics.get().viewport.zoomByWheelDelta(-e.deltaY);
    });

    // opens the node if the click was short
    $states.graphics.get().app.stage.on('pointerup', () => {
        const DRAG_TIME_THRESHOLD = 200;

        if (renderedNode.held && performance.now() - holdStartTime < DRAG_TIME_THRESHOLD) {
            // setTimeout(() => thoughtClicked(thought.id), 30); //timeout to prevent overlay from registering the click too

            // const oldHighlightedNode = $states.context.get().highlightedNode;
            // if (oldHighlightedNode !== null) oldHighlightedNode.dirty = true;

            // const contextState = $states.context.get().getState();
            // contextState.setHighlightedNode(renderedNode);
            // renderedNode.dirty = true;
        }
        renderedNode.held = false;
        renderedNode.dragged = false;
    });


    const style = new TextStyle({
        breakWords: false,
        wordWrap: true,
        fontFamily: 'Arial',
        fontSize: 15,
        fontWeight: 'bold',
        fill: 'white',
        wordWrapWidth: renderedNode.radius * 4,
        stroke: "#000000",
        // dropShadow: true,
        // dropShadowDistance: 2,
    });

    const text = new Text(renderedNode.title, style);
    text.zIndex = TEXT_Z;
    text.x = renderedNode.x - text.width / 2;
    text.y = renderedNode.y - text.height / 2 + text.height / 2 + DEFAULT_RADIUS + 5;
    renderedNode.text = text;

    $states.graphics.get().textContainer.addChild(text);
    return renderedNode;
};