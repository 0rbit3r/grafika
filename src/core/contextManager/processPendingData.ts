import { initializeRenderedEdge } from "../renderedEdge";
import { initializeRenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";
import { ContextStore } from "../../state/contextStore";
import { getNodeProxy } from "../../api/proxyNode";

const GOLDEN_ANGLE = 2.39996; // radians — distributes nodes in a spiral

const findNode = ($context: ContextStore, id: string) => {
    const n = $context.nodesById.get(id);
    return n?.timeToLiveTo === undefined ? n : undefined;
};

export function processPendingData($states: GraphStoresContainer, batchSize: number) {
    const $context = $states.context;
    const $simulation = $states.simulation;

    if ($context.pendingNodes.length === 0 && $context.pendingEdges.length === 0 && $context.notRenderedEdgesById.size === 0) return;

    const nodeBatch = $context.pendingNodes.splice(0, batchSize);
    nodeBatch.forEach(newNode => {
        if (findNode($context, newNode.id)) return;

        if (newNode.x === undefined) newNode.x = Math.cos($context.pendingAngle) * $simulation.initialPositionsRadius;
        if (newNode.y === undefined) newNode.y = Math.sin($context.pendingAngle) * $simulation.initialPositionsRadius;
        $context.pendingAngle += GOLDEN_ANGLE;

        const newRenderedNode = initializeRenderedNode(newNode, $states);
        $context.renderedNodes.push(newRenderedNode);
        $context.nodesById.set(newRenderedNode.id, newRenderedNode);
        $states.interactionEvents.emit("nodeAdded", getNodeProxy(newRenderedNode, $states));
    });

    // resolve notRenderedEdgesById unblocked by newly added nodes
    for (const [nreKey, notRenderedEdge] of $context.notRenderedEdgesById) {
        const sourceRenderedNode = findNode($context, notRenderedEdge.sourceId);
        const targetRenderedNode = findNode($context, notRenderedEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode
            && !$context.edgesById.has(nreKey)) {
            const newRenderedEdge = initializeRenderedEdge(notRenderedEdge, sourceRenderedNode, targetRenderedNode, $states);
            $context.renderedEdges.push(newRenderedEdge);
            $context.edgesById.set(nreKey, newRenderedEdge);
            sourceRenderedNode.outEdges.add(newRenderedEdge);
            targetRenderedNode.inEdges.add(newRenderedEdge);
            $context.notRenderedEdgesById.delete(nreKey);

            sourceRenderedNode.adjacentNodeIds.add(targetRenderedNode.id);
            targetRenderedNode.adjacentNodeIds.add(sourceRenderedNode.id);
        }
    }

    // process pending edges for this batch window
    const edgeBatch = $context.pendingEdges.splice(0, batchSize);
    edgeBatch.forEach(newEdge => {
        const edgeKey = `${newEdge.sourceId}->${newEdge.targetId}`;
        const sourceRenderedNode = findNode($context, newEdge.sourceId);
        const targetRenderedNode = findNode($context, newEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode
            && !$context.edgesById.has(edgeKey)) {
            const newRenderedEdge = initializeRenderedEdge(newEdge, sourceRenderedNode, targetRenderedNode, $states);
            $context.renderedEdges.push(newRenderedEdge);
            $context.edgesById.set(edgeKey, newRenderedEdge);
            sourceRenderedNode.outEdges.add(newRenderedEdge);
            targetRenderedNode.inEdges.add(newRenderedEdge);

            sourceRenderedNode.adjacentNodeIds.add(targetRenderedNode.id);
            targetRenderedNode.adjacentNodeIds.add(sourceRenderedNode.id);
        } else if (!sourceRenderedNode || !targetRenderedNode) {
            if (!$context.notRenderedEdgesById.has(edgeKey))
                $context.notRenderedEdgesById.set(edgeKey, newEdge);
        }
    });
}
