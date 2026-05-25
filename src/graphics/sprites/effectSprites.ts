import { Application, Graphics, Sprite, Texture } from "pixi.js";
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
        graphics.circle(0, 0, (NODE_SPRITE_RADIUS + 400)).stroke({ width: 500, color: '#ffffff', alpha: 0.05 });
        graphics.circle(0, 0, (NODE_SPRITE_RADIUS + 350)).stroke({ width: 400, color: '#ffffff', alpha: 0.05 });
        graphics.circle(0, 0, (NODE_SPRITE_RADIUS + 300)).stroke({ width: 300, color: '#ffffff', alpha: 0.05 });
        graphics.circle(0, 0, (NODE_SPRITE_RADIUS + 250)).stroke({ width: 200, color: '#ffffff', alpha: 0.05 });
        graphics.circle(0, 0, (NODE_SPRITE_RADIUS + 200)).stroke({ width: 100, color: '#ffffff', alpha: 0.2 });
        baseTextures.glow = app.renderer.generateTexture(graphics);
        graphics.destroy();
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
        graphics.circle(0, 0, (NODE_SPRITE_RADIUS * 0.45)).stroke({ width: NODE_SPRITE_RADIUS * 0.1, color: '#888888' });
        baseTextures.hollowRim = app.renderer.generateTexture(graphics);
        graphics.destroy();
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
        graphics.circle(0, 0, (NODE_SPRITE_RADIUS * 0.45)).fill(app.renderer.background.color);
        baseTextures.hollowHole = app.renderer.generateTexture(graphics);
        graphics.destroy();
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
        const circles = 10;
        for (let i = 0; i <= circles; i++) {
            graphics.circle(0, 0, NODE_SPRITE_RADIUS * Math.pow(1.15, i))
                .fill({ color: '#ffffff', alpha: Math.max(0.001, (1 - i / circles) * 0.1) });
        }

        baseTextures.blink = app.renderer.generateTexture(graphics);
        graphics.destroy();
    }
    sprite = Sprite.from(baseTextures.blink);

    sprite.anchor.set(0.5);
    sprite.eventMode = "none";
    return sprite;
}
