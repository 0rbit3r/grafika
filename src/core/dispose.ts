import { GraphStoresContainer } from "../state/storesContainer"

export const disposeState = ($states: GraphStoresContainer) => {
    const $graphics = $states.graphics.get();
    const $context = $states.context.get();

    $context.renderedEdges.forEach(e => {
        e.sprite?.destroy(true);
    });
    $context.renderedNodes.forEach(n => {
        n.sprite?.destroy(true);
    });

    $states.context.setKey("edgesAdjacency", new Map());
    $states.context.setKey("notRenderedEdges", []);
    $states.context.setKey("renderedEdges", []);
    $states.context.setKey("renderedNodes", []);
    $states.context.setKey("proxyEdgesMap", new Map());
    $states.context.setKey("proxyEdgesMap", new Map());


    $states.graphics.get().unloadOverlayTexture().then(() => {
        $graphics.app.destroy(true, { children: true, texture: true, baseTexture: true });
    });
}