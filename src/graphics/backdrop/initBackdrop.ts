import { Sprite, Assets } from "pixi.js";
import { BACKDROP_Z } from "../zIndexes";

export const initBackdrop = async (url: string) => {
    const texture = await Assets.load(url);
    const backdropSprite = new Sprite(texture);
    backdropSprite.anchor.set(0.5);
    backdropSprite.eventMode = "none";
    backdropSprite.zIndex = BACKDROP_Z;
    return backdropSprite;
}
