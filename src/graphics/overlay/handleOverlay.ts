import { Sprite } from "pixi.js";
import { GraphicsStore } from "../../state/graphicsStore";

export const handleOverlay = (overlaySprite: Sprite, $graphics: GraphicsStore) => {
    if (!$graphics.overlay) return;

    const sizeOnScreen =  $graphics.overlay.scale * $graphics.viewport.zoom;
    const onScreenCoors = $graphics.viewport.toViewportCoordinates(
        { x: $graphics.overlay.position, y: $graphics.overlay.position }
    );

    overlaySprite.setTransform(
        onScreenCoors.x, onScreenCoors.y,
        sizeOnScreen, sizeOnScreen);
    const overlayOpacity =
        1 - Math.min(1, Math.max(0, $graphics.viewport.zoom - $graphics.overlay.startDisappearingAt)
            / ($graphics.overlay.disappearCompletelyAt - $graphics.overlay.startDisappearingAt));

    overlaySprite.alpha = overlayOpacity;

    $graphics.nodeContainer.alpha = 1 - overlayOpacity;
    $graphics.edgeContainer.alpha = $graphics.nodeContainer.alpha;
    // $graphics.textContainer.alpha = $graphics.nodeContainer.alpha;
}