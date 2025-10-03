import { Application, Graphics, SCALE_MODES, Sprite, Texture } from "pixi.js";
import { NODE_SPRITE_RADIUS } from "./nodeSprites";

interface BaseTexturesContainer {
    hollowRim: Texture | undefined;
    hollowHole: Texture | undefined;
    glow: Texture | undefined;
    blink: Texture | undefined;
}

const baseTextures: BaseTexturesContainer = {
    hollowRim: undefined,
    hollowHole: undefined,
    glow: undefined,
    blink: undefined
}

export const getGlowSprite = (app: Application) => {
    let sprite: Sprite = null!;
    if (!baseTextures.glow || baseTextures.glow.destroyed) {
        const graphics = new Graphics();
        graphics.lineStyle(500, "#ffffff", 0.05);
        graphics.drawCircle(0, 0, (NODE_SPRITE_RADIUS + 400));

        graphics.lineStyle(400, "#ffffff", 0.05);
        graphics.drawCircle(0, 0, (NODE_SPRITE_RADIUS + 350));

        graphics.lineStyle(300, "#ffffff", 0.05);
        graphics.drawCircle(0, 0, (NODE_SPRITE_RADIUS + 300));

        graphics.lineStyle(200, "#ffffff", 0.05);
        graphics.drawCircle(0, 0, (NODE_SPRITE_RADIUS + 250));

        graphics.lineStyle(100, "#ffffff", 0.2);
        graphics.drawCircle(0, 0, (NODE_SPRITE_RADIUS + 200));
        baseTextures.glow = app.renderer.generateTexture(graphics,
            {
                scaleMode: SCALE_MODES.LINEAR,
                resolution: 1
            });
        graphics.destroy({ children: true, baseTexture: true, texture: true });
    }
    sprite = Sprite.from(baseTextures.glow);

    sprite.anchor.set(0.5);
    sprite.eventMode = "none";
    return sprite;
}

export const getHollowRimSprite = (app: Application) => {
    let sprite: Sprite = null!;
    if (!baseTextures.hollowRim || baseTextures.hollowRim.destroyed) {
        const graphics = new Graphics();
        graphics.lineStyle(NODE_SPRITE_RADIUS * 0.1, "#888888", 1);
        graphics.drawCircle(0, 0, (NODE_SPRITE_RADIUS * 0.45));
        baseTextures.hollowRim = app.renderer.generateTexture(graphics,
            {
                scaleMode: SCALE_MODES.LINEAR,
                resolution: 1
            });
        graphics.destroy({ children: true, baseTexture: true, texture: true });
    }
    sprite = Sprite.from(baseTextures.hollowRim);

    sprite.anchor.set(0.5);
    sprite.eventMode = "none";
    return sprite;
}

// We need to make the hole from two parts because the inside has background color, whilst the rim is tinted to node color
export const getHollowHoleSprite = (app: Application) => {
    let sprite: Sprite = null!;
    if (!baseTextures.hollowHole || baseTextures.hollowHole.destroyed) {
        const graphics = new Graphics();
        graphics.beginFill(app.renderer.background.backgroundColor.toHex(), 1);
        graphics.lineStyle();
        graphics.drawCircle(0, 0, (NODE_SPRITE_RADIUS * 0.45));
        graphics.endFill();
        baseTextures.hollowHole = app.renderer.generateTexture(graphics,
            {
                scaleMode: SCALE_MODES.LINEAR,
                resolution: 1
            });
        graphics.destroy({ children: true, baseTexture: true, texture: true });
    }
    sprite = Sprite.from(baseTextures.hollowHole);

    sprite.anchor.set(0.5);
    sprite.eventMode = "none";
    return sprite;
}

export const getBlinkSprite = (app: Application) => {
    let sprite: Sprite = null!;
    if (!baseTextures.blink || baseTextures.blink.destroyed) {
        const graphics = new Graphics();
        const circles = 15;
        for(let i = 0;i <= circles;i++){
            graphics.beginFill("#ffffff", Math.max(0.001, (1 - i / circles) * 0.1));
            graphics.drawCircle(0, 0, NODE_SPRITE_RADIUS * Math.pow(1.15, i));
            graphics.endFill();
        }

        baseTextures.blink = app.renderer.generateTexture(graphics,
            {
                scaleMode: SCALE_MODES.LINEAR,
                resolution: 1
            });
        graphics.destroy({ children: true, baseTexture: true, texture: true });
    }
    sprite = Sprite.from(baseTextures.blink);

    sprite.anchor.set(0.5);
    sprite.eventMode = "none";
    return sprite;
}