import { Sprite, Assets } from "pixi.js";
import { OVERLAY_Z } from "../zIndexes";

export const OVERLAY_SPRITE_WIDTH = 100;

export const initOverlay = (url: string) => {
        
        const overlayTexture = new Sprite();
        Assets.load(url).then(t => { overlayTexture.texture = t });
        overlayTexture.width = OVERLAY_SPRITE_WIDTH;
        overlayTexture.height = OVERLAY_SPRITE_WIDTH;
        overlayTexture.position.set(- overlayTexture.width / 2, - overlayTexture.height / 2);

        overlayTexture.eventMode = "none";
        overlayTexture.zIndex = OVERLAY_Z;
       
        return overlayTexture;
}