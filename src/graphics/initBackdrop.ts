import { Sprite, Assets } from "pixi.js";

export const initBackdrop = (url: string) => {

        const backdropTexture = new Sprite();
        Assets.load(url).then(t => { backdropTexture.texture = t });
        backdropTexture.width = 100;
        backdropTexture.height = 100;
        backdropTexture.position.set(- backdropTexture.width / 2, - backdropTexture.height / 2);
    
        backdropTexture.alpha = 1;
        backdropTexture.interactive = false;
        backdropTexture.hitArea = null;
        backdropTexture.zIndex = -1;
       
        return backdropTexture;
}