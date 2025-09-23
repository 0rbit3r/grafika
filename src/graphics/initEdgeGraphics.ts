import { RenderedEdge } from "../core/renderedEdge";
import { GraphStoresContainer } from "../state/storesContainer";
import { getEdgeSprite } from "./sprites/edgeSprites";

export const initEdgeGraphics = (edge: RenderedEdge, $states: GraphStoresContainer) => {
    const $graphics = $states.graphics.get();
    const sprite = getEdgeSprite($graphics.app, edge);

    edge.sprite = sprite;
    edge.isOnScreen = false;
    sprite && (sprite.tint = (edge.color ?? "#dddddd"));
    // sprite && $graphics.edgeContainer.addChild(sprite); -> handled in loader

    sprite && (sprite.eventMode = "none");
}