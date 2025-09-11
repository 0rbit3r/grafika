import { GraphData } from "../../api/settings";
import { initializeRenderedEdge } from "../renderedEdge";
import { initializeRenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";
import { INITIAL_POSITIONS_RADIUS } from "../defaultGraphOptions";

export function addData($states: GraphStoresContainer, data: GraphData) {
    let angle = 0;
    data.nodes.forEach(newNode => {
        if (newNode.x === undefined && data.nodes.length > 1) newNode.x = Math.cos(angle) * INITIAL_POSITIONS_RADIUS;
        if (newNode.y === undefined && data.nodes.length > 1) newNode.y = Math.sin(angle) * INITIAL_POSITIONS_RADIUS;

        angle += Math.PI * 2 / data.nodes.length;
        $states.context.get().renderedNodes.push(
            initializeRenderedNode(newNode, $states)
        );
    });

    $states.context.get().notRenderedEdges.forEach(notRenderedEdge => {
        const sourceRenderedNode = $states.context.get().renderedNodes.find(n => n.id == notRenderedEdge.sourceId);
        const targetRenderedNode = $states.context.get().renderedNodes.find(n => n.id == notRenderedEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode) {
            const newRenderedEdge = initializeRenderedEdge(notRenderedEdge, sourceRenderedNode, targetRenderedNode, $states);
            $states.context.get().renderedEdges.push(newRenderedEdge);
            sourceRenderedNode.edges.push(newRenderedEdge);
            targetRenderedNode.edges.push(newRenderedEdge);
        }
    })

    data.edges.forEach(newEdge => {
        const sourceRenderedNode = $states.context.get().renderedNodes.find(n => n.id == newEdge.sourceId);
        const targetRenderedNode = $states.context.get().renderedNodes.find(n => n.id == newEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode) {
            const newRenderedEdge = initializeRenderedEdge(newEdge, sourceRenderedNode, targetRenderedNode, $states);
            $states.context.get().renderedEdges.push(newRenderedEdge);
            sourceRenderedNode.edges.push(newRenderedEdge);
            targetRenderedNode.edges.push(newRenderedEdge);
        }
        else {
            $states.context.get().notRenderedEdges.push(newEdge);
        }
    });
}