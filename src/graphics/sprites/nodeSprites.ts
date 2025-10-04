import { Application, Circle, Graphics, SCALE_MODES, Sprite, Texture, Text } from "pixi.js";
import { NodeShape } from "../../api/dataTypes";
import { NODE_BORDER_THICKNESS } from "../../core/defaultGraphOptions";
import { RenderedNode } from "../../core/renderedNode";

export const NODE_SPRITE_RADIUS = 200;
export const TEXT_BOX_CORNER_RADIUS = 10;

interface BaseTexturesContainer {
    circle: Texture | undefined;
    square: Texture | undefined;
    diamond: Texture | undefined;
    upTriangle: Texture | undefined;
    downTriangle: Texture | undefined;
    cross: Texture | undefined;
    heart: Texture | undefined;

    textBox: Texture | undefined;
}

const baseTextures: BaseTexturesContainer = {
    circle: undefined,
    square: undefined,
    diamond: undefined,
    upTriangle: undefined,
    downTriangle: undefined,
    cross: undefined,
    heart: undefined,

    textBox: undefined
}

export function getNodeSprite(app: Application, node: RenderedNode): Sprite {
    let sprite: Sprite = null!;
    switch (node.shape) {
        default:
        case NodeShape.Circle:
            if (!baseTextures.circle || baseTextures.circle.destroyed) {
                const graphics = new Graphics();
                graphics.beginFill("#ffffff");
                graphics.lineStyle(NODE_SPRITE_RADIUS * NODE_BORDER_THICKNESS, "#888888");
                graphics.drawCircle(0, 0, NODE_SPRITE_RADIUS);
                baseTextures.circle = app.renderer.generateTexture(graphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1
                    });
                graphics.destroy({ children: true, baseTexture: true, texture: true });
            }
            sprite = Sprite.from(baseTextures.circle);
            sprite.anchor.set(0.5);
            break;
        case NodeShape.Square:
            if (!baseTextures.square || baseTextures.square.destroyed) {
                const graphics = new Graphics();
                graphics.beginFill("#ffffff");
                graphics.lineStyle(NODE_SPRITE_RADIUS * NODE_BORDER_THICKNESS, "#888888");
                graphics.drawRoundedRect(
                    - NODE_SPRITE_RADIUS / 3 * 2, - NODE_SPRITE_RADIUS / 3 * 2,
                    NODE_SPRITE_RADIUS * 4 / 3, NODE_SPRITE_RADIUS * 4 / 3, NODE_SPRITE_RADIUS / 3
                );
                baseTextures.square = app.renderer.generateTexture(graphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1
                    });
            }
            sprite = Sprite.from(baseTextures.square);
            sprite.anchor.set(0.5);
            break;
        case NodeShape.Diamond:
            if (!baseTextures.diamond || baseTextures.diamond.destroyed) {
                const graphics = new Graphics();
                graphics.moveTo(0, 0 - NODE_SPRITE_RADIUS);
                graphics.arcTo(0 - NODE_SPRITE_RADIUS, 0, 0, 0 + NODE_SPRITE_RADIUS, NODE_SPRITE_RADIUS / 3);
                graphics.beginFill("#ffffff");
                graphics.lineStyle(NODE_SPRITE_RADIUS * NODE_BORDER_THICKNESS, "#888888");
                graphics.arcTo(0, 0 + NODE_SPRITE_RADIUS, 0 + NODE_SPRITE_RADIUS, 0, NODE_SPRITE_RADIUS / 3);
                graphics.arcTo(0 + NODE_SPRITE_RADIUS, 0, 0, 0 - NODE_SPRITE_RADIUS, NODE_SPRITE_RADIUS / 3);
                graphics.arcTo(0, 0 - NODE_SPRITE_RADIUS, 0 - NODE_SPRITE_RADIUS, 0, NODE_SPRITE_RADIUS / 3);
                graphics.arcTo(0 - NODE_SPRITE_RADIUS, 0, 0, 0 + NODE_SPRITE_RADIUS, NODE_SPRITE_RADIUS / 3);
                baseTextures.diamond = app.renderer.generateTexture(graphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1
                    });
            }
            sprite = Sprite.from(baseTextures.diamond);
            sprite.anchor.set(0.5);
            break;
        case NodeShape.UpTriangle:
            if (!baseTextures.upTriangle || baseTextures.upTriangle.destroyed) {
                const graphics = new Graphics();
                graphics.moveTo(0, 0 - NODE_SPRITE_RADIUS);
                graphics.beginFill("#ffffff");
                graphics.lineStyle(NODE_SPRITE_RADIUS * NODE_BORDER_THICKNESS, "#888888");
                graphics.lineTo(0 - NODE_SPRITE_RADIUS * Math.sqrt(3) / 2, 0 + NODE_SPRITE_RADIUS / 2);
                graphics.lineTo(0 + NODE_SPRITE_RADIUS * Math.sqrt(3) / 2, 0 + NODE_SPRITE_RADIUS / 2);
                graphics.lineTo(0, 0 - NODE_SPRITE_RADIUS);
                baseTextures.upTriangle = app.renderer.generateTexture(graphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1
                    });
            }
            sprite = Sprite.from(baseTextures.upTriangle);
            sprite.anchor.set(0.5, 1.95 / 3) //I was lazy to do math...
            break;
        case NodeShape.DownTriangle:
            if (!baseTextures.downTriangle || baseTextures.downTriangle.destroyed) {
                const graphics = new Graphics();
                graphics.moveTo(0, NODE_SPRITE_RADIUS);
                graphics.beginFill("#ffffff");
                graphics.lineStyle(NODE_SPRITE_RADIUS * NODE_BORDER_THICKNESS, "#888888");
                graphics.lineTo(-NODE_SPRITE_RADIUS * Math.sqrt(3) / 2, -NODE_SPRITE_RADIUS / 2);
                graphics.lineTo(NODE_SPRITE_RADIUS * Math.sqrt(3) / 2, -NODE_SPRITE_RADIUS / 2);
                graphics.lineTo(0, NODE_SPRITE_RADIUS);
                baseTextures.downTriangle = app.renderer.generateTexture(graphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1
                    });
            }
            sprite = Sprite.from(baseTextures.downTriangle);
            sprite.anchor.set(0.5, 1 - 1.95 / 3)
            break;
        case NodeShape.Cross:
            if (!baseTextures.cross || baseTextures.cross.destroyed) {
                const graphics = new Graphics();
                graphics.beginFill("#ffffff");
                graphics.lineStyle(NODE_SPRITE_RADIUS * NODE_BORDER_THICKNESS, "#888888");
                const gridSize = NODE_SPRITE_RADIUS / 7 * 3;

                graphics.moveTo(0, 0 - gridSize);
                graphics.lineTo(0 - gridSize, 0 - gridSize * 2);
                graphics.lineTo(0 - gridSize * 2, 0 - gridSize);
                graphics.lineTo(0 - gridSize, 0);
                graphics.lineTo(0 - gridSize * 2, 0 + gridSize);
                graphics.lineTo(0 - gridSize, 0 + gridSize * 2);
                graphics.lineTo(0, 0 + gridSize);
                graphics.lineTo(0 + gridSize, 0 + gridSize * 2);
                graphics.lineTo(0 + gridSize * 2, 0 + gridSize);
                graphics.lineTo(0 + gridSize, 0);
                graphics.lineTo(0 + gridSize * 2, 0 - gridSize);
                graphics.lineTo(0 + gridSize, 0 - gridSize * 2);
                graphics.lineTo(0, 0 - gridSize);
                graphics.endFill();

                baseTextures.cross = app.renderer.generateTexture(graphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1
                    });
            }
            sprite = Sprite.from(baseTextures.cross);
            sprite.anchor.set(0.5)
            break;
        case NodeShape.Heart:
            if (!baseTextures.heart || baseTextures.heart.destroyed) {
                const graphics = new Graphics();
                const yOffset = NODE_SPRITE_RADIUS * 0.3;
                graphics.beginFill("#ffffff");
                graphics.lineStyle(NODE_SPRITE_RADIUS * NODE_BORDER_THICKNESS, "#888888");

                graphics.moveTo(0, NODE_SPRITE_RADIUS * 0.6 + yOffset);
                graphics.bezierCurveTo(-NODE_SPRITE_RADIUS * 1.7, NODE_SPRITE_RADIUS * -0.25 + yOffset, -NODE_SPRITE_RADIUS * 0.93, -NODE_SPRITE_RADIUS * 1.75 + yOffset, 0, -NODE_SPRITE_RADIUS * 0.8 + yOffset);
                graphics.bezierCurveTo(NODE_SPRITE_RADIUS * 0.93, -NODE_SPRITE_RADIUS * 1.75 + yOffset, NODE_SPRITE_RADIUS * 1.7, NODE_SPRITE_RADIUS * -0.25 + yOffset, 0, NODE_SPRITE_RADIUS * 0.6 + yOffset);

                graphics.endFill();
                baseTextures.heart = app.renderer.generateTexture(graphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1
                    });
            }
            sprite = Sprite.from(baseTextures.heart);
            sprite.anchor.set(0.5);
            break;
        case NodeShape.TextBox:
            if (!baseTextures.textBox || baseTextures.textBox.destroyed) {
                const graphics = new Graphics();
                graphics.beginFill("#222222");
                graphics.lineStyle(NODE_SPRITE_RADIUS * NODE_BORDER_THICKNESS / 2, "#ffffff");

                graphics.drawRoundedRect(
                    - NODE_SPRITE_RADIUS / 3 * 2, - NODE_SPRITE_RADIUS / 3 * 2,
                    NODE_SPRITE_RADIUS * 4 / 3, NODE_SPRITE_RADIUS * 4 / 3, NODE_SPRITE_RADIUS / 3);
                graphics.endFill();
                baseTextures.textBox = app.renderer.generateTexture(graphics,
                    {
                        scaleMode: SCALE_MODES.LINEAR,
                        resolution: 1
                    });
            }
            sprite = Sprite.from(baseTextures.textBox);
            sprite.anchor.set(0.5);
            break;
    }
    // todo - polygon hitareas for others (especially triangles as they now have big areas of hitArea outside)
    sprite.hitArea = new Circle(0, 0, NODE_SPRITE_RADIUS + 10); // + 10 to make it slightly easier to grip on touchscreens
    return sprite;
}