import { Assets } from "pixi.js";
import { GraphStoresContainer } from "../state/storesContainer"
import { destroySpriteTextureCache } from "../graphics/sprites/textureCache";

export const disposeState = async ($states: GraphStoresContainer) => {
    $states.interactionEvents.all.clear();
    const $graphics = $states.graphics;
    const $context = $states.context;

    // Settle outstanding addData/removeData promises — their work will never finish now
    $context.addTrackers.forEach(t => t.callback());
    $context.removeTrackers.forEach(t => t.callback());
    $context.addTrackers.length = 0;
    $context.removeTrackers.length = 0;

    // children only — textures are shared within the instance via the sprite texture
    // cache and are destroyed once, below
    $context.renderedEdges.forEach(e => {
        e.sprite?.destroy({ children: true });
        e.source = null!;
        e.target = null!;
    });
    $context.renderedNodes.forEach(n => {
        n.sprite?.destroy({ children: true });
        n.inEdges = new Set();
        n.outEdges = new Set();
        n.adjacentNodeIds = new Set();
    });

    $states.context.notRenderedEdgesById = new Map();
    $states.context.notRenderedEdgesByNodeId = new Map();
    $states.context.renderedEdges.clear();
    $states.context.renderedNodes.clear();
    $states.context.proxyNodesMap = new WeakMap();
    $states.context.proxyEdgesMap = new WeakMap();
    $graphics.viewport.dispose();
    $graphics.viewport = null!;

    // Assets.load() textures must be unloaded via Assets — not app.destroy — or the cache entry survives pointing at a dead texture
    if ($graphics.overlaySettings?.url) await Assets.unload($graphics.overlaySettings.url);
    if ($graphics.backdropSettings?.url) await Assets.unload($graphics.backdropSettings.url);

    $graphics.app.destroy(true, { children: true, texture: true });
    destroySpriteTextureCache($graphics.spriteTextures);
    $states.context = null!;
    $states.debug = null!;
    $states.graphics = null!;
    $states.interactionEvents.all.clear();
    $states.interactionEvents = null!
    $states.simulation = null!;
}
