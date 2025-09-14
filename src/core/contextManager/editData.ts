import { initializeRenderedEdge } from "../renderedEdge";
import { initializeRenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";
import { INITIAL_POSITIONS_RADIUS } from "../defaultGraphOptions";
import { drawNode } from "../../graphics/drawNode";
import { drawEdge } from "../../graphics/drawEdge";
import { GraphData, GraphEdge } from "../../api/dataTypes";
import { removeData } from "./removeData";

// Edits found nodes and edges according to non-undefined fields of the new data
// When argument field is left undefined, the value is not updated
// Not found ids are ignored
export function editData($states: GraphStoresContainer, editedData: GraphData) {
    const $dataContext = $states.context.get();

    // todo: AI-optimized code - double check 
    // --- Pre-index nodes and edges for O(1) lookup ---
    const editedNodeMap = new Map(editedData.nodes.map(n => [n.id, n]));
    const editedEdgeMap = new Map<string, GraphEdge>();
    for (const edge of editedData.edges) {
        editedEdgeMap.set(`${edge.sourceId}_${edge.targetId}`, edge);
    }

    // --- Update rendered nodes ---
    for (const renderedNode of $dataContext.renderedNodes) {
        const matchingNode = editedNodeMap.get(renderedNode.id);
        if (!matchingNode) continue;

        if (matchingNode.color !== undefined) renderedNode.color = matchingNode.color;
        if (matchingNode.hollowEffect !== undefined) renderedNode.hollowEffect = matchingNode.hollowEffect;
        if (matchingNode.blinkEffect !== undefined) renderedNode.blinkEffect = matchingNode.blinkEffect;
        if (matchingNode.radius !== undefined) renderedNode.radius = matchingNode.radius;
        if (matchingNode.shape !== undefined) renderedNode.shape = matchingNode.shape;
        if (matchingNode.title !== undefined) renderedNode.title = matchingNode.title;
        if (matchingNode.x !== undefined) renderedNode.x = matchingNode.x;
        if (matchingNode.y !== undefined) renderedNode.y = matchingNode.y;

        

        drawNode(renderedNode, $states);
    }

    // --- Update rendered edges ---
    for (const re of $dataContext.renderedEdges) {
        const matchingEdge = editedEdgeMap.get(`${re.source.id}_${re.target.id}`);
        if (!matchingEdge) continue;

        if (matchingEdge.color !== undefined) re.color = matchingEdge.color;
        if (matchingEdge.type !== undefined) re.type = matchingEdge.type;
        if (matchingEdge.weight !== undefined) re.weight = matchingEdge.weight;

        drawEdge(re, $states);
    }

    // --- Update not rendered edges ---
    for (const nre of $dataContext.notRenderedEdges) {
        const matchingEdge = editedEdgeMap.get(`${nre.sourceId}_${nre.targetId}`);
        if (!matchingEdge) continue;

        if (matchingEdge.color !== undefined) nre.color = matchingEdge.color;
        if (matchingEdge.type !== undefined) nre.type = matchingEdge.type;
        if (matchingEdge.weight !== undefined) nre.weight = matchingEdge.weight;
    }
}
