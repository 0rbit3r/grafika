import { Texture } from "pixi.js";

// Per-instance cache of pre-rendered sprite textures. Textures are created with
// app.renderer.generateTexture(), so they live in one renderer's GL context and
// must never be shared between grafika instances.
export interface SpriteTextureCache {
    node: {
        circle?: Texture;
        square?: Texture;
        diamond?: Texture;
        upTriangle?: Texture;
        downTriangle?: Texture;
        cross?: Texture;
        heart?: Texture;
        textBox?: Texture;
        textCard?: Texture;
    };
    edge: {
        lineEdge?: Texture;
        arrowEdge?: Texture;
        taperedEdge?: Texture;
        curvedEdge?: Texture;
        animated?: Texture[];
    };
    effect: {
        hollowRim?: Texture;
        hollowHole?: Texture;
        glow?: Texture;
        blink?: Texture;
    };
}

export const createSpriteTextureCache = (): SpriteTextureCache => ({
    node: {},
    edge: {},
    effect: {},
});

const destroyTexture = (texture?: Texture) => {
    if (texture && !texture.destroyed) texture.destroy(true);
};

export const destroySpriteTextureCache = (cache: SpriteTextureCache) => {
    Object.values(cache.node).forEach(destroyTexture);
    Object.values(cache.effect).forEach(destroyTexture);
    const { animated, ...edgeTextures } = cache.edge;
    Object.values(edgeTextures).forEach(destroyTexture);
    animated?.forEach(destroyTexture);
};
