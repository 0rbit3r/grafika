import { Sprite, Assets, Texture } from "pixi.js";
import { OVERLAY_Z } from "../zIndexes";

export const initOverlay = (url: string) => {
        const overlaySprite = Sprite.from(url);
        overlaySprite.anchor.set(0.5);

        overlaySprite.eventMode = "none";
        overlaySprite.zIndex = OVERLAY_Z;

        return overlaySprite;
}