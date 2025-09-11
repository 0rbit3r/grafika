// todo: add rendered nodes and edges (+ bulk circle layout for nodes if no position specified)

// then figure out rotation and position updates of the edges

// no biggie
import { GraphData } from "../../api/settings";
import { GraphEdge, GraphNode } from "../../api/dataTypes";
import { initializeRenderedEdge } from "../renderedEdge";
import { initializeRenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";
import { INITIAL_POSITIONS_RADIUS } from "../defaultGraphOptions";

export function addData($states: GraphStoresContainer, data: GraphData) {
    const $dataContext = $states.context.get();

    let angle = 0;
    data.nodes.forEach(newNode => {
        if (newNode.x === undefined) newNode.x = Math.cos(angle) * INITIAL_POSITIONS_RADIUS;
        if (newNode.y === undefined) newNode.y = Math.sin(angle) * INITIAL_POSITIONS_RADIUS;

        angle += Math.PI * 2 / data.nodes.length;
        $dataContext.renderedNodes.push(
            initializeRenderedNode(newNode, $states)
        );
    });

    $dataContext.notRenderedEdges.forEach(notRenderedEdge => {
        const sourceRenderedNode = $dataContext.renderedNodes.find(n => n.id == notRenderedEdge.sourceId);
        const targetRenderedNode = $dataContext.renderedNodes.find(n => n.id == notRenderedEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode) {
            const newRenderedEdge = initializeRenderedEdge(notRenderedEdge, sourceRenderedNode, targetRenderedNode, $states);
            $dataContext.renderedEdges.push(newRenderedEdge);
            sourceRenderedNode.edges.push(newRenderedEdge);
            targetRenderedNode.edges.push(newRenderedEdge);
        }
    })

    data.edges.forEach(newEdge => {
        const sourceRenderedNode = $dataContext.renderedNodes.find(n => n.id == newEdge.sourceId);
        const targetRenderedNode = $dataContext.renderedNodes.find(n => n.id == newEdge.targetId);
        if (sourceRenderedNode && targetRenderedNode) {
            const newRenderedEdge = initializeRenderedEdge(newEdge, sourceRenderedNode, targetRenderedNode, $states);
            $dataContext.renderedEdges.push(newRenderedEdge);
            sourceRenderedNode.edges.push(newRenderedEdge);
            targetRenderedNode.edges.push(newRenderedEdge);
        }
        else {
            $dataContext.notRenderedEdges.push(newEdge);
        }
    });
}