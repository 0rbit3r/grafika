import { Application, Graphics, SCALE_MODES, Sprite, Texture, TYPES } from "pixi.js";
import { EdgeType } from "../../api/dataTypes";
import { RenderedEdge } from "../../core/renderedEdge";

export const EDGE_SPRITE_LENGTH = 800;
const ARROWHEAD_LENGTH = EDGE_SPRITE_LENGTH / 2;
const ARROWHEAD_THICKNESS = 100;

export const TAPERED_EDGE_WIDTH = EDGE_SPRITE_LENGTH / 10;

const LINE_EDGE_WIDTH = EDGE_SPRITE_LENGTH / 20;

interface BaseTexturesContainer {
    arrowEdge: Texture | undefined;
    lineEdge: Texture | undefined;
    taperedEdge: Texture | undefined;
    curvedEdge: Texture | undefined;
}

const baseTextures: BaseTexturesContainer = {
    lineEdge: undefined,
    arrowEdge: undefined,
    taperedEdge: undefined,
    curvedEdge: undefined
}

export function getEdgeSprite(app: Application, edge: RenderedEdge): Sprite | null {
    let sprite: Sprite = null!;

    console.log(edge.type);

    switch (edge.type) {
        case EdgeType.None:
            return null;
        case EdgeType.Line:
        default:
            if (!baseTextures.lineEdge || baseTextures.lineEdge.destroyed) {
                const edgeGraphics = new Graphics();
                edgeGraphics.lineStyle({ width: LINE_EDGE_WIDTH, color: "#ffffff", alpha: 0.2 });
                edgeGraphics.moveTo(0, 0);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH, 0);
                baseTextures.lineEdge = app.renderer.generateTexture(edgeGraphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1
                    }
                );
                //edgeGraphics.destroy({ children: true, baseTexture: true, texture: true });
            }
            sprite = Sprite.from(baseTextures.lineEdge);
            break;
        case EdgeType.Arrow:
            if (!baseTextures.arrowEdge || baseTextures.arrowEdge.destroyed) {
                const edgeGraphics = new Graphics();
                edgeGraphics.moveTo(0, 0);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, 0);
                edgeGraphics.beginFill("#ffffff", 0.2);
                edgeGraphics.lineStyle();
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, -ARROWHEAD_THICKNESS);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH, 0);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, ARROWHEAD_THICKNESS);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, 0);
                edgeGraphics.endFill();
                baseTextures.arrowEdge = app.renderer.generateTexture(edgeGraphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1,
                    }
                );
               // edgeGraphics.destroy({ children: true, baseTexture: true, texture: true });

            }
            sprite = Sprite.from(baseTextures.arrowEdge);
            break;
        case EdgeType.Tapered:
            if (!baseTextures.taperedEdge || baseTextures.taperedEdge.destroyed) {
                const edgeGraphics = new Graphics();
                const segments = 100;

                edgeGraphics.lineStyle(0); // no outline

                const len = EDGE_SPRITE_LENGTH;
                const ux = 1;  // unit vector along x-axis
                const uy = 0;
                const px = 0;  // perpendicular vector
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

                    const segmentAlpha = 0.5 * t0;

                    edgeGraphics.beginFill("#ffffff", segmentAlpha);
                    edgeGraphics.drawPolygon(quad);
                    edgeGraphics.endFill();
                }
                baseTextures.taperedEdge = app.renderer.generateTexture(edgeGraphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1,
                    }
                );
                //edgeGraphics.destroy({ children: true, baseTexture: true, texture: true });

            }
            sprite = Sprite.from(baseTextures.taperedEdge);
            break;
        case EdgeType.CurvedLine:
            if (!baseTextures.curvedEdge || baseTextures.curvedEdge.destroyed) {
                const edgeGraphics = new Graphics();
                edgeGraphics.moveTo(0, 0);
                edgeGraphics.lineStyle({ width: 30, color: "#ffffff", alpha: 0.2 });
                edgeGraphics.quadraticCurveTo(
                    EDGE_SPRITE_LENGTH / 2,
                    -EDGE_SPRITE_LENGTH / 2,
                    EDGE_SPRITE_LENGTH,
                    0
                );
                baseTextures.curvedEdge = app.renderer.generateTexture(edgeGraphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1,
                    }
                );
               // edgeGraphics.destroy({ children: true, baseTexture: true, texture: true });

            }
            sprite = Sprite.from(baseTextures.curvedEdge);
            break;
    }

    console.log(`sprite for edge ${edge.source.id}->${edge.target.id}:`);
    console.log(sprite);

    edge.type === EdgeType.CurvedLine
        ? sprite.anchor.set(0, 1)
        : sprite.anchor.set(0, 0.5);
    return sprite;
}