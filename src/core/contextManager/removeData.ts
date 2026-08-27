import { Data } from "../../api/dataTypes";
import { GraphStoresContainer } from "../../state/storesContainer";
import { filterInPlace } from "../../util/filterInPlace";
import { RenderedEdge } from "../renderedEdge";
import { NEW_NODE_FADE_OUT_FRAMES } from "../defaultGraphOptions";

// Resolves once every removed node has finished fading out and was destroyed.
// Requires the ticker to be running; disposing the instance settles the promise early.
export function removeDataByIds($states: GraphStoresContainer, dataToRemove?: Data): Promise<void> {
    if (!dataToRemove)
        dataToRemove = {
            edges: Array.from($states.context.notRenderedEdgesById.values()).map(e => ({ sourceId: e.sourceId, targetId: e.targetId }))
                .concat([...$states.context.renderedEdges.values()].map(e => ({ sourceId: e.source.id, targetId: e.target.id }))),
            nodes: [...$states.context.renderedNodes.values()]
        }

    if (dataToRemove.nodes === undefined) dataToRemove.nodes = [];
    if (dataToRemove.edges === undefined) dataToRemove.edges = [];

    const removeNodeIds = new Set(dataToRemove.nodes.map(n => n.id));
    const removeEdgeKeys = new Set(dataToRemove.edges.map(e => `${e.sourceId}->${e.targetId}`));

    // Schedule fade-out for deleted nodes; stagger TTLs so at most 10 expire per frame
    filterInPlace($states.context.pendingNodes, n => !removeNodeIds.has(n.id));

    const nodesToFade = [...$states.context.renderedNodes.values()].filter(existingNode =>
        removeNodeIds.has(existingNode.id));

    nodesToFade.forEach((node, i) => {
        const batchOffset = Math.floor(i / 10);
        const newTTL = node.framesAlive + NEW_NODE_FADE_OUT_FRAMES + batchOffset;
        node.timeToLiveTo = node.timeToLiveTo !== undefined ? Math.min(node.timeToLiveTo, newTTL) : newTTL;
        node.sprite?.removeAllListeners();
    });

    const dyingNodeIds = new Set(nodesToFade.map(n => n.id));

    // Clear adjacency for dying nodes so they stop influencing force calculations
    nodesToFade.forEach(node => {
        node.adjacentNodeIds.clear();
        node.inEdges.forEach(e => e.source.adjacentNodeIds.delete(node.id));
        node.outEdges.forEach(e => e.target.adjacentNodeIds.delete(node.id));
    });

    // Edges on dying nodes stay in renderedEdges to fade; collect them to exclude from immediate destruction
    const edgesOnDyingNodes = new Set<RenderedEdge>();
    nodesToFade.forEach(node => {
        node.inEdges.forEach(e => edgesOnDyingNodes.add(e));
        node.outEdges.forEach(e => edgesOnDyingNodes.add(e));
    });

    // Destroy explicitly requested edges not connected to any dying node immediately
    const edgesToDestroyNow = new Set<RenderedEdge>();
    dataToRemove.edges?.forEach(e => {
        const renderedEdge = $states.context.renderedEdges.get(`${e.sourceId}->${e.targetId}`);
        if (renderedEdge && !edgesOnDyingNodes.has(renderedEdge))
            edgesToDestroyNow.add(renderedEdge);
    });

    edgesToDestroyNow.forEach(e => {
        e.sprite?.destroy({ children: true });
        $states.context.renderedEdges.delete(`${e.source.id}->${e.target.id}`);
        e.target.inEdges.delete(e);
        e.source.outEdges.delete(e);
        e.source.adjacentNodeIds.delete(e.target.id);
        e.target.adjacentNodeIds.delete(e.source.id);
    });

    for (const [key, ne] of $states.context.notRenderedEdgesById) {
        if (dyingNodeIds.has(ne.sourceId) || dyingNodeIds.has(ne.targetId)
            || removeEdgeKeys.has(key)) {
            $states.context.notRenderedEdgesById.delete(key);
            $states.context.notRenderedEdgesByNodeId.get(ne.sourceId)?.delete(ne);
            $states.context.notRenderedEdgesByNodeId.get(ne.targetId)?.delete(ne);
        }
    }

    // Drain any addTrackers waiting on nodes that are now being removed.
    // Does NOT settle promises here — processPendingData does that on the next tick,
    // preventing synchronous re-entrancy if a continuation calls back into removeData.
    if (removeNodeIds.size > 0) {
        $states.context.addTrackers.forEach(tracker =>
            removeNodeIds.forEach(id => tracker.pendingIds.delete(id))
        );
    }

    return new Promise<void>(resolve => {
        // Always push — even if nodesToFade is empty (pendingIds will be an empty Set),
        // processPendingData resolves it on the next tick rather than synchronously here.
        $states.context.removeTrackers.push({ pendingIds: new Set(nodesToFade.map(n => n.id)), callback: resolve });
    });
}
