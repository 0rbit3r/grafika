import { Graphics } from "pixi.js";
import { RenderedNode } from "./renderedNode";

export interface RenderedEdge {
    source: RenderedNode;
    target: RenderedNode;

    graphics: Graphics;
} 