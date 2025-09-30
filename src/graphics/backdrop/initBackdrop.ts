import { Sprite, Assets, Texture } from "pixi.js";
import { BACKDROP_Z } from "../zIndexes";

export const initBackdrop = (url: string) => {
        const backdropSprite = Sprite.from(url);
        backdropSprite.anchor.set(0.5)

        backdropSprite.eventMode = "none";
        backdropSprite.zIndex = BACKDROP_Z;
        
        return backdropSprite;
}