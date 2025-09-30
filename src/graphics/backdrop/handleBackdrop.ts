import { Sprite } from "pixi.js";
import { GraphicsStore } from "../../state/graphicsStore";

export const handleBackdrop = (backdropSprite: Sprite, $graphics: GraphicsStore) => {
    if (!$graphics.backdropSettings) return;

    const sizeOnScreen = $graphics.backdropSettings.scale * $graphics.viewport.zoom;

    //     $graphics.backdropSettings.scale * ($graphics.viewport.zoom / zoomFactor + 1 - 1 / zoomFactor);
    // todo - right now thew backdrop does not respect zoom - the image is fixed in size and it moves uncanily while zoming
    // (relative to world origin - ie. the position wil have to take into account zoom / size on screen as well?)

    // const onScreenCoors = {
    //         x: ($graphics.viewport.position.x  * ($graphics.backdropSettings.parallax - 1)) + $graphics.viewport.width / 2 * $graphics.viewport.zoom,
    //         y: ($graphics.viewport.position.y * ($graphics.backdropSettings.parallax - 1)) + $graphics.viewport.height / 2* $graphics.viewport.zoom
    //     }
    
    const onScreenCoors = $graphics.viewport.toViewportCoordinates({
        x: $graphics.viewport.position.x * $graphics.backdropSettings.parallax,
        y: $graphics.viewport.position.y * $graphics.backdropSettings.parallax,
    });

    backdropSprite.setTransform(
        onScreenCoors.x, onScreenCoors.y,
        sizeOnScreen, sizeOnScreen);

    const backdropOpacity =
        Math.min(1, Math.max(0, $graphics.viewport.zoom - $graphics.backdropSettings.startAppearingAt)
            / ($graphics.backdropSettings.fullyVisibleAt - $graphics.backdropSettings.startAppearingAt));

    backdropSprite.alpha = backdropOpacity;
}