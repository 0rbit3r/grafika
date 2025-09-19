import { RenderedEdge } from "../core/renderedEdge";
import { NodeShape, GraphNodeInit } from "../api/dataTypes";
import { Graphics, TextStyle, Text, Sprite } from "pixi.js";
import { DEFAULT_RADIUS, TEXT_WORD_WRAP, ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../core/defaultGraphOptions";
import { GraphStoresContainer } from "../state/storesContainer";
import { TEXT_Z } from "../graphics/zIndexes";
// import { drawNode } from "../graphics/drawNode";
import { XAndY } from "../api/dataTypes";
import { getNodeProxy } from "../api/proxyNode";
import { getNodeSprite } from "../graphics/sprites/nodeSprites";
import { initNodeGraphics } from "../graphics/initNodeGraphics";
import { handleNodeLoading } from "../graphics/dynamicLoader";

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

    sprite: Sprite | null;
    // blinkingGraphics: Graphics;
    text: Text | null;
    radius: number;

    held: boolean;
    hovered: boolean;

    // counts the number of frames since the node appeared
    framesAlive: number;

    forces: XAndY;
    momentum: XAndY;

    isOnScreen: boolean;

    renderDisplacement: XAndY;
}

// Will initialize graphics and put it in the nodeContainer
export const initializeRenderedNode = (node: GraphNodeInit, $states: GraphStoresContainer) => {

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

        sprite: null,
        // blinkingGraphics: new Graphics(),
        radius: node.radius ?? DEFAULT_RADIUS,
        text: null,
        held: false,
        hovered: false,
        framesAlive: 0,
        forces: { x: 0, y: 0 },
        momentum: { x: 0, y: 0 },
        isOnScreen: false,
        renderDisplacement: {x: 0, y: 0}
    };
    initNodeGraphics(renderedNode, $states);
    handleNodeLoading(renderedNode, $states.graphics.get())

    return renderedNode;
};