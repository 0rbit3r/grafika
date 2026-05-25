import { GraphStoresContainer } from "../../state/storesContainer";
import { Data } from "../../api/dataTypes";

export function addData($states: GraphStoresContainer, data: Data, onFinished?: () => void) {
    if (data.nodes) $states.context.pendingNodes.push(...data.nodes);
    if (data.edges) $states.context.pendingEdges.push(...data.edges);

    if (onFinished) {
        // Always push — even for empty node lists (pendingIds will be an empty Set),
        // processPendingData fires it on the next tick rather than synchronously here.
        const ids = data.nodes?.map(n => n.id) ?? [];
        $states.context.addTrackers.push({ pendingIds: new Set(ids), callback: onFinished });
    }
}