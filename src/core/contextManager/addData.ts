import { initializeRenderedEdge } from "../renderedEdge";
import { initializeRenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";
import { INITIAL_POSITIONS_RADIUS } from "../defaultGraphOptions";
import { Data, GraphEdge } from "../../api/dataTypes";
import { getNodeProxy } from "../../api/proxyNode";
import { getEdgeProxy } from "../../api/proxyEdge";
import { filterInPlace } from "../../util/filterInPlace";

export function addData($states: GraphStoresContainer, data: Data) {
    if (data.nodes === undefined) data.nodes = [];
    if (data.edges === undefined) data.edges = [];

    let $context = $states.context;
    const $simulation = $states.simulation;

    let angle = 0;
    data.nodes.forEach(newNode => {
        if (newNode.x === undefined && data.nodes!.length > 1) newNode.x = Math.cos(angle) * $simulation.initialPositionsRadius;
        if (newNode.y === undefined && data.nodes!.length > 1) newNode.y = Math.sin(angle) * $simulation.initialPositionsRadius;

        angle += Math.PI * 2 / data.nodes!.length;
        const newRenderedNode = initializeRenderedNode(newNode, $states);
        $context.renderedNodes.push(newRenderedNode);
        $context.proxyNodesList.push(getNodeProxy(newRenderedNode, $states));
    });

    // handle finding notrenderedEdge that should be instantiated by the new data
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
    // remove notRenderedEdges that have been instantiated
    filterInPlace($context.notRenderedEdges, nre => !instantiatedNotRenderedEdges.has(nre));

    data.edges.forEach(newEdge => {
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

            // update adjacency map
            if ($context.edgesAdjacency.get(sourceRenderedNode.id) === undefined)
                $context.edgesAdjacency.set(sourceRenderedNode.id, new Set());
            $context.edgesAdjacency.get(sourceRenderedNode.id)?.add(targetRenderedNode?.id ?? -1);
            if ($context.edgesAdjacency.get(targetRenderedNode.id) === undefined)
                $context.edgesAdjacency.set(targetRenderedNode.id, new Set());
            $context.edgesAdjacency.get(targetRenderedNode.id)?.add(sourceRenderedNode?.id ?? -1);
        }
        else if (!sourceRenderedNode || !targetRenderedNode) {
            if (!$context.notRenderedEdges.some(e => e.sourceId === newEdge.sourceId && e.targetId === newEdge.targetId))
                $context.notRenderedEdges.push(newEdge);
        }
    });
}   