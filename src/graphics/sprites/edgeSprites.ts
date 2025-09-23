import { Application, Graphics, SCALE_MODES, Sprite, Texture } from "pixi.js";
import { EdgeType } from "../../api/dataTypes";
import { RenderedEdge } from "../../core/renderedEdge";

export const EDGE_SPRITE_LENGTH = 800;
const ARROWHEAD_LENGTH = EDGE_SPRITE_LENGTH / 4;

export const TAPERED_EDGE_WIDTH = EDGE_SPRITE_LENGTH / 10;
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
            }
            sprite = Sprite.from(baseTextures.lineEdge);
            break;
        case EdgeType.Arrow:
            if (!baseTextures.arrowEdge || baseTextures.arrowEdge.destroyed) {
                const edgeGraphics = new Graphics();
                edgeGraphics.lineStyle();
                edgeGraphics.lineTo(0, -LINE_EDGE_WIDTH / 2);
                edgeGraphics.beginFill("#ffffff", 0.2);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, -LINE_EDGE_WIDTH / 3);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, -ARROWHEAD_WIDTH);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH, 0);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, ARROWHEAD_WIDTH);
                edgeGraphics.lineTo(EDGE_SPRITE_LENGTH - ARROWHEAD_LENGTH, LINE_EDGE_WIDTH / 3);
                edgeGraphics.lineTo(0, LINE_EDGE_WIDTH / 2);
                edgeGraphics.lineTo(0, -LINE_EDGE_WIDTH / 2);


                edgeGraphics.endFill();
                baseTextures.arrowEdge = app.renderer.generateTexture(edgeGraphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1,
                    }
                );
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
            }
            sprite = Sprite.from(baseTextures.curvedEdge);
            break;
        // case EdgeType.Animated:
        //     const SEGMENTS = 10;
        //     const FRAMES = 16;
        //     if (!baseTextures.animated || baseTextures.animated.some(t => t.destroyed)) {
        //         const frames: Texture[] = [];

        //         for (let frame = 0; frame < FRAMES; frame++) {
        //             const g = new Graphics();
        //             g.lineStyle({ width: LINE_EDGE_WIDTH, color: 0xffffff, alpha: 0.2 });
        //             g.moveTo(0, 0);
        //             g.lineTo(EDGE_SPRITE_LENGTH, 0);

        //             for (let segment = 0; segment < SEGMENTS; segment++) {

        //                 // draw a small dot shifting to the right each frame
        //                 const dotX = EDGE_SPRITE_LENGTH / SEGMENTS * segment + (EDGE_SPRITE_LENGTH / SEGMENTS / FRAMES) * frame;
        //                 console.log(`f: ${frame} s: ${segment} x: ${dotX}`);
        //                 g.beginFill(0xffffff, 0.6);
        //                 g.drawCircle(dotX, 0, 5);
        //                 g.endFill();
        //             }

        //             frames.push(
        //                 app.renderer.generateTexture(g, {
        //                     scaleMode: SCALE_MODES.LINEAR,
        //                     resolution: 1
        //                 })
        //             );
        //         }
        //         baseTextures.animated = frames;
        //     }

        //     const animatedSprite = new AnimatedSprite(baseTextures.animated);
        //     animatedSprite.animationSpeed = 1;
        //     animatedSprite.autoUpdate = false;
        //     animatedSprite.play();
        //     animatedSprite.anchor.set(0, 0.5);
        //     animatedSprite.loop = true;
        //     return animatedSprite;
        //     break;
    }

    edge.type === EdgeType.CurvedLine
        ? sprite.anchor.set(0, 1)
        : sprite.anchor.set(0, 0.5);
    return sprite;
}