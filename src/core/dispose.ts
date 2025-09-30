import { GraphStoresContainer } from "../state/storesContainer"

export const disposeState = ($states: GraphStoresContainer) => {
    const $graphics = $states.graphics;
    const $context = $states.context;

    $context.renderedEdges.forEach(e => {
        e.sprite?.destroy(true);
        e.source = null!;
        e.target = null!;
    });
    $context.renderedNodes.forEach(n => {
        n.sprite?.destroy(true);
        n.inEdges = new Set();
        n.outEdges = new Set();
    });

    $states.context.edgesAdjacency = new Map();
    $states.context.notRenderedEdges = [];
    $states.context.renderedEdges = [];
    $states.context.renderedNodes = [];
    $states.context.proxyEdgesMap = new Map();
    $states.context.proxyEdgesMap = new Map();
    $graphics.viewport = null!;


    $states.graphics.unloadOverlayTexture().then(() => {
        $states.graphics.unloadBackdropTexture().then(() => {
            $graphics.app.destroy(true, { children: true, texture: true, baseTexture: true });
            $states.context = null!;
            $states.debug = null!;
            $states.graphics = null!;
            $states.interactionEvents.all.clear();
            $states.interactionEvents = null!
            $states.simulation = null!;
        });
    });
}