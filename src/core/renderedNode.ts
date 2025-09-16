import { RenderedEdge } from "../core/renderedEdge";
import { NodeShape, GraphNodeInit } from "../api/dataTypes";
import { Graphics, TextStyle, Text } from "pixi.js";
import { DEFAULT_RADIUS, TEXT_WORD_WRAP, ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../core/defaultGraphOptions";
import { GraphStoresContainer } from "../state/storesContainer";
import { TEXT_Z } from "../graphics/zIndexes";
import { drawNode } from "../graphics/drawNode";
import { XAndY } from "../api/dataTypes";
import { getNodeProxy } from "../api/proxyNode";

export interface RenderedNode {
    id: number;
    inEdges: Set<RenderedEdge>;
    outEdges:Set<RenderedEdge>;

    x: number;
    y: number;
    title: string;
    color: string;
    shape: NodeShape;

    hollowEffect: boolean;
    glowEffect: boolean;
    blinkEffect: boolean;

    graphics: Graphics;
    blinkingGraphics: Graphics;
    text: Text;
    radius: number;

    held: boolean;
    hovered: boolean;

    // counts the number of frames since the node appeared
    framesAlive: number;

    forces: XAndY;
    momentum: XAndY;
}

// Will initialize graphics and put it in the nodeContainer
export const initializeRenderedNode = (node: GraphNodeInit, $states: GraphStoresContainer) => {
    const nodeGraphics = new Graphics();

    $states.graphics.get().nodeContainer.addChild(nodeGraphics);

    const renderedNode: RenderedNode = {
        id: node.id,
        shape: node.shape ?? NodeShape.Circle,
        title: node.title ?? node.id.toString(),
        x: node.x ?? Math.random() * 2 - 1,
        y: node.y ?? Math.random() * 2 - 1,
        color: node.color ?? "#dddddd",
        inEdges: new Set(),
        outEdges: new Set(),

        hollowEffect: node.hollowEffect ?? false,
        blinkEffect: node.blinkEffect ?? false,
        glowEffect: node.glowEffect ?? false,

        graphics: nodeGraphics,
        blinkingGraphics: new Graphics(),
        radius: node.radius ?? DEFAULT_RADIUS,
        text: null!,
        held: false,
        hovered: false,
        framesAlive: 0,
        forces: { x: 0, y: 0 },
        momentum: { x: 0, y: 0 }
    };
    drawNode(renderedNode, $states);

    //interactivity
    nodeGraphics.eventMode = 'static';
    nodeGraphics.cursor = 'pointer';

    let holdStartTime = 0;

    nodeGraphics.on('globalpointermove', e => {
        const $graphics = $states.graphics.get();
        if (renderedNode.held && $graphics.app.ticker.started) {
            const zoom = $states.graphics.get().viewport.zoom;
            renderedNode.x += e.movementX / zoom;
            renderedNode.y += e.movementY / zoom;
            $states.interactionEvents.emit("nodeDragged", getNodeProxy(renderedNode, $states));
            // console.log(renderedNode.x, renderedNode.graphics.x);
        }
    });

    nodeGraphics.on('pointerdown', () => {
        if (!$states.graphics.get().app.ticker.started) return;
        $states.simulation.setKey("frame", 0);
        renderedNode.held = true;
        holdStartTime = performance.now();
    });

    nodeGraphics.on('pointerover', () => {
        if (!$states.graphics.get().app.ticker.started) return;
        renderedNode.hovered = true;
    });
    nodeGraphics.on('pointerout', () => {
        // if (!$states.graphics.get().app.ticker.started) return; //I think leaving this condition here is reasonable
        renderedNode.hovered = false;
    });
    nodeGraphics.on('pointerupoutside', () => {
        renderedNode.held = false;
        renderedNode.hovered = false;
    });
    nodeGraphics.on('wheel', (e) => {
        const $graphics = $states.graphics.get();
        if (!$graphics.app.ticker.started) return;
        e.preventDefault();
        e.stopPropagation();
        const worldCenter = $graphics.viewport.toGlobalCoordinates({ x: e.globalX, y: e.globalY });
        const factor = e.deltaY < 0 ? ZOOM_STEP_MULTIPLICATOR_WHEEL : 1 / ZOOM_STEP_MULTIPLICATOR_WHEEL;
        $graphics.viewport.updateZoom($graphics.viewport.zoom * factor, worldCenter);
    });

    // opens the node if the click was short
    $states.graphics.get().app.stage.on('pointerup', () => {
        const DRAG_TIME_THRESHOLD = 200;

        if (renderedNode.held && performance.now() - holdStartTime < DRAG_TIME_THRESHOLD
            && $states.graphics.get().app.ticker.started) {
            const nodeProxy = $states.context.get().proxyNodesMap.get(renderedNode);
            if (nodeProxy)
                $states.interactionEvents.emit("nodeClicked", nodeProxy);
            else
                console.error("Not initialized node proxy for node " + node.id);
            // setTimeout(() => thoughtClicked(thought.id), 30); //timeout to prevent overlay from registering the click too
        }
        renderedNode.held = false;
    });


    const style = new TextStyle({
        breakWords: false,
        wordWrap: true,
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 'white',
        wordWrapWidth: TEXT_WORD_WRAP,
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