import { Data } from "../../api/dataTypes";
import { GraphStoresContainer } from "../../state/storesContainer";
import { filterInPlace } from "../../util/filterInPlace";
import { RenderedEdge } from "../renderedEdge";
import { NEW_NODE_FADE_OUT_FRAMES } from "../defaultGraphOptions";

export function removeDataByIds($states: GraphStoresContainer, dataToRemove?: Data) {
    if (!dataToRemove)
        dataToRemove = {
            edges: Array.from($states.context.notRenderedEdgesById.values()).map(e => ({ sourceId: e.sourceId, targetId: e.targetId }))
                .concat($states.context.renderedEdges.map(e => ({ sourceId: e.source.id, targetId: e.target.id }))),
            nodes: $states.context.renderedNodes
        }

    if (dataToRemove.nodes === undefined) dataToRemove.nodes = [];
    if (dataToRemove.edges === undefined) dataToRemove.edges = [];

    // Schedule fade-out for deleted nodes; stagger TTLs so at most 10 expire per frame
    filterInPlace($states.context.pendingNodes, n => !dataToRemove.nodes?.find(r => r.id === n.id));

    const nodesToFade = $states.context.renderedNodes.filter(existingNode =>
        (dataToRemove.nodes?.find(n => n.id === existingNode.id)));

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
        const renderedEdge = $states.context.edgesById.get(`${e.sourceId}->${e.targetId}`);
        if (renderedEdge && !edgesOnDyingNodes.has(renderedEdge))
            edgesToDestroyNow.add(renderedEdge);
    });

    $states.context.renderedEdges = $states.context.renderedEdges.filter(e => !edgesToDestroyNow.has(e));
    edgesToDestroyNow.forEach(e => {
        e.sprite?.destroy({ children: true });
        $states.context.edgesById.delete(`${e.source.id}->${e.target.id}`);
        e.target.inEdges.delete(e);
        e.source.outEdges.delete(e);
        e.source.adjacentNodeIds.delete(e.target.id);
        e.target.adjacentNodeIds.delete(e.source.id);
    });

    for (const [key, ne] of $states.context.notRenderedEdgesById) {
        if (dyingNodeIds.has(ne.sourceId) || dyingNodeIds.has(ne.targetId)
            || dataToRemove.edges?.find(e => e.sourceId === ne.sourceId && e.targetId === ne.targetId) !== undefined)
            $states.context.notRenderedEdgesById.delete(key);
    }
}
