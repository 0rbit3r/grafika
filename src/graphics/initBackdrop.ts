import { Sprite, Assets } from "pixi.js";
import { BACKDROP_Z } from "./zIndexes";

export const initBackdrop = (url: string) => {
        
        const backdropTexture = new Sprite();
        Assets.load(url).then(t => { backdropTexture.texture = t });
        backdropTexture.width = 100;
        backdropTexture.height = 100;
        backdropTexture.position.set(- backdropTexture.width / 2, - backdropTexture.height / 2);

        backdropTexture.eventMode = "none";
        backdropTexture.zIndex = BACKDROP_Z;
       
        return backdropTexture;
}