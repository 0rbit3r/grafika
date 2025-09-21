import { Sprite, Assets } from "pixi.js";
import { OVERLAY_Z } from "../zIndexes";

export const OVERLAY_SPRITE_WIDTH = 100;

export const initOverlay = (url: string) => {
        const overlaySprite = new Sprite();
        Assets.load(url).then(t => { overlaySprite.texture = t });
        overlaySprite.width = OVERLAY_SPRITE_WIDTH;
        overlaySprite.height = OVERLAY_SPRITE_WIDTH;
        overlaySprite.position.set(- overlaySprite.width / 2, - overlaySprite.height / 2);

        overlaySprite.eventMode = "none";
        overlaySprite.zIndex = OVERLAY_Z;
       
        return overlaySprite;
}