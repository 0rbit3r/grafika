import { GraphStoresContainer } from "../state/storesContainer"

export const disposeState = ($states: GraphStoresContainer) => {
    const $graphics = $states.graphics;
    const $context = $states.context;

    $context.renderedEdges.forEach(e => {
        e.sprite?.destroy(true);
    });
    $context.renderedNodes.forEach(n => {
        n.sprite?.destroy(true);
    });

    $states.context.edgesAdjacency = new Map();
    $states.context.notRenderedEdges = [];
    $states.context.renderedEdges = [];
    $states.context.renderedNodes = [];
    $states.context.proxyEdgesMap = new Map();
    $states.context.proxyEdgesMap = new Map();


    $states.graphics.unloadOverlayTexture().then(() => {
        $graphics.app.destroy(true, { children: true, texture: true, baseTexture: true });
    });
}