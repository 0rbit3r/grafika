import { initializeRenderedEdge } from "../renderedEdge";
import { initializeRenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";
import { INITIAL_POSITIONS_RADIUS } from "../defaultGraphOptions";
import { DataInit, EdgeInit } from "../../api/dataTypes";
import { getNodeProxy } from "../../api/proxyNode";
import { getEdgeProxy } from "../../api/proxyEdge";
import { filterInPlace } from "../../util/filterInPlace";

export function addData($states: GraphStoresContainer, data: DataInit) {
    if (data.nodes === undefined) data.nodes = [];
    if (data.edges === undefined) data.edges = [];

    let $context = $states.context.get();
    const $simulation = $states.simulation.get();

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
    const instantiatedNotRenderedEdges = new Set<EdgeInit>();
    $context.notRenderedEdges.forEach(notRenderedEdge => {
        const sourceRenderedNode = $context.renderedNodes.find(n => n.id === notRenderedEdge.sourceId);
        const targetRenderedNode = $context.renderedNodes.find(n => n.id === notRenderedEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode) {
            const newRenderedEdge = initializeRenderedEdge(notRenderedEdge, sourceRenderedNode, targetRenderedNode, $states);
            $context.renderedEdges.push(newRenderedEdge);
            sourceRenderedNode.outEdges.add(newRenderedEdge);
            targetRenderedNode.inEdges.add(newRenderedEdge);
            $context.proxyEdgesList.push(getEdgeProxy(newRenderedEdge, $states));
            instantiatedNotRenderedEdges.add(notRenderedEdge);
        }
    });
    // remove notRenderedEdges that have been instantiated
    filterInPlace($context.notRenderedEdges, nre => !instantiatedNotRenderedEdges.has(nre));

    data.edges.forEach(newEdge => {
        const sourceRenderedNode = $context.renderedNodes.find(n => n.id === newEdge.sourceId);
        const targetRenderedNode = $context.renderedNodes.find(n => n.id === newEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode) {
            const newRenderedEdge = initializeRenderedEdge(newEdge, sourceRenderedNode, targetRenderedNode, $states);
            $context.renderedEdges.push(newRenderedEdge);
            sourceRenderedNode.outEdges.add(newRenderedEdge);
            targetRenderedNode.inEdges.add(newRenderedEdge);
        }
        else {
            $context.notRenderedEdges.push(newEdge);
        }

        if ($context.edgesAdjacency.get(sourceRenderedNode?.id ?? -1) === undefined)
            $context.edgesAdjacency.set(sourceRenderedNode?.id ?? -1, new Set());
        $context.edgesAdjacency.get(sourceRenderedNode?.id ?? -1)?.add(targetRenderedNode?.id ?? -1);
        if ($context.edgesAdjacency.get(targetRenderedNode?.id ?? -1) === undefined)
            $context.edgesAdjacency.set(targetRenderedNode?.id ?? -1, new Set());
        $context.edgesAdjacency.get(targetRenderedNode?.id ?? -1)?.add(sourceRenderedNode?.id ?? -1);
    });
}   