import { Application, Graphics, Sprite, Texture } from "pixi.js";
import { EdgeType } from "../../api/dataTypes";
import { RenderedEdge } from "../../core/renderedEdge";

export const EDGE_SPRITE_LENGTH = 800;
const ARROWHEAD_LENGTH = EDGE_SPRITE_LENGTH / 4;

export const TAPERED_EDGE_WIDTH = EDGE_SPRITE_LENGTH / 5;
const ARROWHEAD_WIDTH = EDGE_SPRITE_LENGTH / 20;
const LINE_EDGE_WIDTH = EDGE_SPRITE_LENGTH / 20;

interface BaseTexturesContainer {
    arrowEdge: Texture | undefined;
    lineEdge: Texture | undefined;
    taperedEdge: Texture | undefined;
    curvedEdge: Texture | undefined;
    animated: Texture[] | undefined;
}

const baseTextures: BaseTexturesContainer = {
    lineEdge: undefined,
    arrowEdge: undefined,
    taperedEdge: undefined,
    curvedEdge: undefined,
    animated: undefined
}

export function getEdgeSprite(app: Application, edge: RenderedEdge): Sprite | null {
    let sprite: Sprite = null!;

    switch (edge.type) {
        case EdgeType.None:
            return null;
        case EdgeType.Line:
        default:
            if (!baseTextures.lineEdge || baseTextures.lineEdge.destroyed) {
                const edgeGraphics = new Graphics();
                edgeGraphics.moveTo(0, 0);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH, 0);
                edgeGraphics.stroke({ width: LINE_EDGE_WIDTH, color: "#ffffff" });
                baseTextures.lineEdge = app.renderer.generateTexture(edgeGraphics);
            }
            sprite = Sprite.from(baseTextures.lineEdge);
            break;
        case EdgeType.Arrow:
            if (!baseTextures.arrowEdge || baseTextures.arrowEdge.destroyed) {
                const edgeGraphics = new Graphics();
                edgeGraphics.moveTo(0, -LINE_EDGE_WIDTH / 2);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, -LINE_EDGE_WIDTH / 3);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, -ARROWHEAD_WIDTH);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH, 0);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, ARROWHEAD_WIDTH);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, LINE_EDGE_WIDTH / 3);
                edgeGraphics.lineTo(0, LINE_EDGE_WIDTH / 2);
                edgeGraphics.closePath();
                edgeGraphics.fill("#ffffff");
                baseTextures.arrowEdge = app.renderer.generateTexture(edgeGraphics);
            }
            sprite = Sprite.from(baseTextures.arrowEdge);
            break;
        case EdgeType.Tapered:
            if (!baseTextures.taperedEdge || baseTextures.taperedEdge.destroyed) {
                const edgeGraphics = new Graphics();
                const segments = 333;

                const len = EDGE_SPRITE_LENGTH;
                const ux = 1;
                const uy = 0;
                const px = 0;
                const py = 1;

                for (let i = 0; i < segments; i++) {
                    const t0 = i / segments;
                    const t1 = (i + 1) / segments;

                    const startX = ux * len * t0;
                    const startY = uy * len * t0;
                    const endX = ux * len * t1;
                    const endY = uy * len * t1;

                    const w0 = (1 - t0) * TAPERED_EDGE_WIDTH;
                    const w1 = (1 - t1) * TAPERED_EDGE_WIDTH;

                    const quad = [
                        startX + px * w0 / 2, startY + py * w0 / 2,
                        startX - px * w0 / 2, startY - py * w0 / 2,
                        endX - px * w1 / 2, endY - py * w1 / 2,
                        endX + px * w1 / 2, endY + py * w1 / 2,
                    ];

                    const segmentAlpha = t0 * t0;
                    edgeGraphics.poly(quad).fill({ color: '#ffffff', alpha: segmentAlpha });
                }
                baseTextures.taperedEdge = app.renderer.generateTexture(edgeGraphics);
            }
            sprite = Sprite.from(baseTextures.taperedEdge);
            break;
        case EdgeType.CurvedLine:
            if (!baseTextures.curvedEdge || baseTextures.curvedEdge.destroyed) {
                const edgeGraphics = new Graphics();
                edgeGraphics.moveTo(0, 0);
                edgeGraphics.quadraticCurveTo(
                    EDGE_SPRITE_LENGTH / 2,
                    -EDGE_SPRITE_LENGTH / 2,
                    EDGE_SPRITE_LENGTH,
                    0
                );
                edgeGraphics.stroke({ width: 30, color: "#ffffff" });
                baseTextures.curvedEdge = app.renderer.generateTexture(edgeGraphics);
            }
            sprite = Sprite.from(baseTextures.curvedEdge);
            break;
    }

    edge.type === EdgeType.CurvedLine
        ? sprite.anchor.set(0, 1)
        : sprite.anchor.set(0, 0.5);
    sprite.alpha = edge.alpha;
    return sprite;
}
