import { Sprite, Assets, Texture } from "pixi.js";
import { BACKDROP_Z } from "../zIndexes";

export const initBackdrop = (url: string) => {
        const backdropSprite = new Sprite();
        Assets.load<Texture>(url).then(downloadedData => {
                backdropSprite.texture = downloadedData
                backdropSprite.width = downloadedData.width;
                backdropSprite.height = downloadedData.height;
                backdropSprite.anchor.set(0.5)

                backdropSprite.eventMode = "none";
                backdropSprite.zIndex = BACKDROP_Z;
        });

        return backdropSprite;
}