import { initializeRenderedEdge } from "../renderedEdge";
import { initializeRenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";
import { GraphEdge } from "../../api/dataTypes";
import { getNodeProxy } from "../../api/proxyNode";
import { getEdgeProxy } from "../../api/proxyEdge";
import { filterInPlace } from "../../util/filterInPlace";

const GOLDEN_ANGLE = 2.39996; // radians — distributes nodes in a spiral

export function processPendingData($states: GraphStoresContainer, batchSize: number) {
    const $context = $states.context;
    const $simulation = $states.simulation;

    if ($context.pendingNodes.length === 0 && $context.pendingEdges.length === 0) return;

    const nodeBatch = $context.pendingNodes.splice(0, batchSize);
    nodeBatch.forEach(newNode => {
        if (newNode.x === undefined) newNode.x = Math.cos($context.pendingAngle) * $simulation.initialPositionsRadius;
        if (newNode.y === undefined) newNode.y = Math.sin($context.pendingAngle) * $simulation.initialPositionsRadius;
        $context.pendingAngle += GOLDEN_ANGLE;

        const newRenderedNode = initializeRenderedNode(newNode, $states);
        $context.renderedNodes.push(newRenderedNode);
        $context.proxyNodesList.push(getNodeProxy(newRenderedNode, $states));
    });

    // resolve notRenderedEdges unblocked by newly added nodes
    const instantiatedNotRenderedEdges = new Set<GraphEdge>();
    const instantiatedEdgePairs = new Set<string>();
    $context.notRenderedEdges.forEach(notRenderedEdge => {
        const sourceRenderedNode = $context.renderedNodes.find(n => n.id === notRenderedEdge.sourceId);
        const targetRenderedNode = $context.renderedNodes.find(n => n.id === notRenderedEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode
            && !$context.renderedEdges.some(e => e.source === sourceRenderedNode && e.target === targetRenderedNode)) {
            const newRenderedEdge = initializeRenderedEdge(notRenderedEdge, sourceRenderedNode, targetRenderedNode, $states);
            $context.renderedEdges.push(newRenderedEdge);
            sourceRenderedNode.outEdges.add(newRenderedEdge);
            targetRenderedNode.inEdges.add(newRenderedEdge);
            $context.proxyEdgesList.push(getEdgeProxy(newRenderedEdge, $states));
            instantiatedNotRenderedEdges.add(notRenderedEdge);
            instantiatedEdgePairs.add(`${notRenderedEdge.sourceId}->${notRenderedEdge.targetId}`);

            if ($context.edgesAdjacency.get(sourceRenderedNode.id) === undefined)
                $context.edgesAdjacency.set(sourceRenderedNode.id, new Set());
            $context.edgesAdjacency.get(sourceRenderedNode.id)?.add(targetRenderedNode.id);
            if ($context.edgesAdjacency.get(targetRenderedNode.id) === undefined)
                $context.edgesAdjacency.set(targetRenderedNode.id, new Set());
            $context.edgesAdjacency.get(targetRenderedNode.id)?.add(sourceRenderedNode.id);
        }
    });
    filterInPlace($context.notRenderedEdges, nre => !instantiatedNotRenderedEdges.has(nre));

    // process pending edges for this batch window
    const edgeBatch = $context.pendingEdges.splice(0, batchSize);
    edgeBatch.forEach(newEdge => {
        if (instantiatedEdgePairs.has(`${newEdge.sourceId}->${newEdge.targetId}`)) return;
        const sourceRenderedNode = $context.renderedNodes.find(n => n.id === newEdge.sourceId);
        const targetRenderedNode = $context.renderedNodes.find(n => n.id === newEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode
            && !$context.renderedEdges.some(e => e.source === sourceRenderedNode && e.target === targetRenderedNode)) {
            const newRenderedEdge = initializeRenderedEdge(newEdge, sourceRenderedNode, targetRenderedNode, $states);
            $context.renderedEdges.push(newRenderedEdge);
            $context.proxyEdgesList.push(getEdgeProxy(newRenderedEdge, $states));
            sourceRenderedNode.outEdges.add(newRenderedEdge);
            targetRenderedNode.inEdges.add(newRenderedEdge);

            if ($context.edgesAdjacency.get(sourceRenderedNode.id) === undefined)
                $context.edgesAdjacency.set(sourceRenderedNode.id, new Set());
            $context.edgesAdjacency.get(sourceRenderedNode.id)?.add(targetRenderedNode.id);
            if ($context.edgesAdjacency.get(targetRenderedNode.id) === undefined)
                $context.edgesAdjacency.set(targetRenderedNode.id, new Set());
            $context.edgesAdjacency.get(targetRenderedNode.id)?.add(sourceRenderedNode.id);
        } else if (!sourceRenderedNode || !targetRenderedNode) {
            if (!$context.notRenderedEdges.some(e => e.sourceId === newEdge.sourceId && e.targetId === newEdge.targetId))
                $context.notRenderedEdges.push(newEdge);
        }
    });
}
