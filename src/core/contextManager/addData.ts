import { GraphStoresContainer } from "../../state/storesContainer";
import { Data } from "../../api/dataTypes";

export function addData($states: GraphStoresContainer, data: Data, onFinished?: () => void) {
    if (data.nodes) $states.context.pendingNodes.push(...data.nodes);
    if (data.edges) $states.context.pendingEdges.push(...data.edges);

    if (onFinished) {
        const ids = data.nodes?.map(n => n.id) ?? [];
        if (ids.length === 0) {
            onFinished();
        } else {
            $states.context.addTrackers.push({ pendingIds: new Set(ids), callback: onFinished });
        }
    }
}