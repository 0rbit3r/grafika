import { initializeRenderedEdge } from "../renderedEdge";
import { initializeRenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";
import { ContextStore } from "../../state/contextStore";
import { getNodeProxy } from "../../api/proxyNode";
import { filterInPlace } from "../../util/filterInPlace";
import { GraphEdge } from "../../api/dataTypes";

const GOLDEN_ANGLE = 2.39996; // radians — distributes nodes in a spiral

function addToNreIndex(index: Map<string, Set<GraphEdge>>, nodeId: string, edge: GraphEdge) {
    let set = index.get(nodeId);
    if (!set) { set = new Set(); index.set(nodeId, set); }
    set.add(edge);
}

function removeFromNreIndex(index: Map<string, Set<GraphEdge>>, nodeId: string, edge: GraphEdge) {
    index.get(nodeId)?.delete(edge);
}

const findNode = ($context: ContextStore, id: string) => {
    const n = $context.renderedNodes.get(id);
    return n?.timeToLiveTo === undefined ? n : undefined;
};

export function processPendingData($states: GraphStoresContainer, batchSize: number) {
    const $context = $states.context;
    const $simulation = $states.simulation;

    // Fire any trackers that have been fully drained — always runs, even when queues are empty.
    // All callback firing is intentionally deferred to here so it never happens synchronously
    // inside removeDataByIds or addData (which would risk re-entrancy / infinite recursion).
    // Snapshot lengths first: if a callback pushes a new tracker, filterInPlace's
    // `while (i < array.length)` would otherwise extend into it in the same pass.
    const addTrackerLen = $context.addTrackers.length;
    const removeTrackerLen = $context.removeTrackers.length;
    filterInPlace($context.addTrackers, (t, i) => {
        if (i! >= addTrackerLen) return true;
        if (t.pendingIds.size === 0) { t.callback(); return false; }
        return true;
    });
    filterInPlace($context.removeTrackers, (t, i) => {
        if (i! >= removeTrackerLen) return true;
        if (t.pendingIds.size === 0) { t.callback(); return false; }
        return true;
    });

    if ($context.pendingNodes.length === 0 && $context.pendingEdges.length === 0 && $context.notRenderedEdgesById.size === 0) return;

    const nodeBatch = $context.pendingNodes.splice(0, batchSize);
    const addedNodeIds: string[] = [];
    nodeBatch.forEach(newNode => {
        // Drain this ID from all addTrackers regardless of whether the node is actually added
        $context.addTrackers.forEach(t => t.pendingIds.delete(newNode.id));

        if (findNode($context, newNode.id)) return; // already exists (not dying), skip

        if (newNode.x === undefined) newNode.x = Math.cos($context.pendingAngle) * $simulation.initialPositionsRadius;
        if (newNode.y === undefined) newNode.y = Math.sin($context.pendingAngle) * $simulation.initialPositionsRadius;
        $context.pendingAngle += GOLDEN_ANGLE;

        const newRenderedNode = initializeRenderedNode(newNode, $states);
        const dyingNode = $context.renderedNodes.get(newNode.id);
        if (dyingNode) {
            dyingNode.sprite?.destroy({ children: true });
            dyingNode.renderedText?.destroy({ children: true });
        }
        $context.renderedNodes.set(newRenderedNode.id, newRenderedNode);
        $states.interactionEvents.emit("nodeAdded", getNodeProxy(newRenderedNode, $states));
        addedNodeIds.push(newRenderedNode.id);
    });

    // resolve only the notRenderedEdges that reference a newly added node
    for (const addedNodeId of addedNodeIds) {
        const candidates = $context.notRenderedEdgesByNodeId.get(addedNodeId);
        if (!candidates) continue;
        for (const notRenderedEdge of Array.from(candidates)) {
            const edgeKey = `${notRenderedEdge.sourceId}->${notRenderedEdge.targetId}`;
            if (!$context.notRenderedEdgesById.has(edgeKey)) continue; // already resolved earlier in this batch
            const sourceRenderedNode = findNode($context, notRenderedEdge.sourceId);
            const targetRenderedNode = findNode($context, notRenderedEdge.targetId);
            if (sourceRenderedNode && targetRenderedNode && !$context.renderedEdges.has(edgeKey)) {
                const newRenderedEdge = initializeRenderedEdge(notRenderedEdge, sourceRenderedNode, targetRenderedNode, $states);
                $context.renderedEdges.set(edgeKey, newRenderedEdge);
                sourceRenderedNode.outEdges.add(newRenderedEdge);
                targetRenderedNode.inEdges.add(newRenderedEdge);
                $context.notRenderedEdgesById.delete(edgeKey);
                removeFromNreIndex($context.notRenderedEdgesByNodeId, notRenderedEdge.sourceId, notRenderedEdge);
                removeFromNreIndex($context.notRenderedEdgesByNodeId, notRenderedEdge.targetId, notRenderedEdge);
                sourceRenderedNode.adjacentNodeIds.add(targetRenderedNode.id);
                targetRenderedNode.adjacentNodeIds.add(sourceRenderedNode.id);
            }
        }
    }

    // process pending edges for this batch window
    const edgeBatch = $context.pendingEdges.splice(0, batchSize);
    edgeBatch.forEach(newEdge => {
        const edgeKey = `${newEdge.sourceId}->${newEdge.targetId}`;
        const sourceRenderedNode = findNode($context, newEdge.sourceId);
        const targetRenderedNode = findNode($context, newEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode
            && !$context.renderedEdges.has(edgeKey)) {
            const newRenderedEdge = initializeRenderedEdge(newEdge, sourceRenderedNode, targetRenderedNode, $states);
            $context.renderedEdges.set(edgeKey, newRenderedEdge);
            sourceRenderedNode.outEdges.add(newRenderedEdge);
            targetRenderedNode.inEdges.add(newRenderedEdge);

            sourceRenderedNode.adjacentNodeIds.add(targetRenderedNode.id);
            targetRenderedNode.adjacentNodeIds.add(sourceRenderedNode.id);
        } else if (!sourceRenderedNode || !targetRenderedNode) {
            if (!$context.notRenderedEdgesById.has(edgeKey)) {
                $context.notRenderedEdgesById.set(edgeKey, newEdge);
                addToNreIndex($context.notRenderedEdgesByNodeId, newEdge.sourceId, newEdge);
                addToNreIndex($context.notRenderedEdgesByNodeId, newEdge.targetId, newEdge);
            }
        }
    });
}
