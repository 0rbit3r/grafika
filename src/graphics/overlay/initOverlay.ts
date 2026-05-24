import { Sprite, Assets } from "pixi.js";
import { OVERLAY_Z } from "../zIndexes";

export const initOverlay = async (url: string) => {
    const texture = await Assets.load(url);
    const overlaySprite = new Sprite(texture);
    overlaySprite.anchor.set(0.5);
    overlaySprite.eventMode = "none";
    overlaySprite.zIndex = OVERLAY_Z;
    return overlaySprite;
}
