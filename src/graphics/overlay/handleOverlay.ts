import { Sprite } from "pixi.js";
import { GraphicsStore } from "../../state/graphicsStore";

export const handleOverlay = (overlaySprite: Sprite, $graphics: GraphicsStore) => {
    if (!$graphics.overlaySettings) return;

    const sizeOnScreen =  $graphics.overlaySettings.scale * $graphics.viewport.zoom;
    const onScreenCoors = $graphics.viewport.toViewportCoordinates(
        { x: $graphics.overlaySettings.position, y: $graphics.overlaySettings.position }
    );

    overlaySprite.setTransform(
        onScreenCoors.x, onScreenCoors.y,
        sizeOnScreen, sizeOnScreen);
    const overlayOpacity =
        1 - Math.min(1, Math.max(0, $graphics.viewport.zoom - $graphics.overlaySettings.startDisappearingAt)
            / ($graphics.overlaySettings.disappearCompletelyAt - $graphics.overlaySettings.startDisappearingAt));

    overlaySprite.alpha = overlayOpacity;

    $graphics.nodeContainer.alpha = 1 - overlayOpacity;
    $graphics.edgeContainer.alpha = $graphics.nodeContainer.alpha;
    // $graphics.textContainer.alpha = $graphics.nodeContainer.alpha;
}