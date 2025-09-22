import { RenderedEdge } from "../core/renderedEdge";
import { NodeShape, NodeInit } from "../api/dataTypes";
import { Text, Sprite } from "pixi.js";
import { DEFAULT_RADIUS } from "../core/defaultGraphOptions";
import { GraphStoresContainer } from "../state/storesContainer";
// import { drawNode } from "../graphics/drawNode";
import { XAndY } from "../api/dataTypes";
import { initNodeGraphics } from "../graphics/initNodeGraphics";
import { handleNodeLoading } from "../graphics/dynamicLoader";
import { computeTextBoxRadius } from "../api/computeTextBoxRadius";

export interface RenderedNode {
    id: number;
    inEdges: Set<RenderedEdge>;
    outEdges: Set<RenderedEdge>;

    x: number;
    y: number;
    text: string;
    color: string;
    shape: NodeShape;

    hollowEffect: boolean;
    glowEffect: boolean;
    blinkEffect: boolean;

    sprite?: Sprite;
    // blinkingGraphics: Graphics;
    renderedText?: Text;
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
export const initializeRenderedNode = (node: NodeInit, $states: GraphStoresContainer) => {

    const $graphics = $states.graphics.get();

    const renderedNode: RenderedNode = {
        id: node.id,
        shape: node.shape ?? $graphics.defaultNodeShape ?? NodeShape.Circle,
        text: node.text ?? node.id.toString(),
        x: node.x ?? Math.random() * 2 - 1,
        y: node.y ?? Math.random() * 2 - 1,
        color: node.color ?? "#dddddd",
        inEdges: new Set(),
        outEdges: new Set(),

        hollowEffect: node.hollowEffect ?? false,
        blinkEffect: node.blinkEffect ?? false,
        glowEffect: node.glowEffect ?? false,

        sprite: undefined,
        // blinkingGraphics: new Graphics(),
        radius: node.radius ??
            (node.shape === NodeShape.TextBox || (!node.shape &&  $graphics.defaultNodeShape === NodeShape.TextBox))
            ? computeTextBoxRadius(node.text ?? node.id.toString())
            : DEFAULT_RADIUS,
        renderedText: undefined,
        held: false,
        hovered: false,
        framesAlive: 0,
        forces: { x: 0, y: 0 },
        momentum: { x: 0, y: 0 },
        isOnScreen: false,
        renderDisplacement: { x: 0, y: 0 }
    };
    initNodeGraphics(renderedNode, $states);
    handleNodeLoading(renderedNode, $graphics)

    return renderedNode;
};