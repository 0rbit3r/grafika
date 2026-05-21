import { GraphStoresContainer } from "../../state/storesContainer";
import { Data } from "../../api/dataTypes";

export function addData($states: GraphStoresContainer, data: Data) {
    if (data.nodes) $states.context.pendingNodes.push(...data.nodes);
    if (data.edges) $states.context.pendingEdges.push(...data.edges);
}