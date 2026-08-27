import { GraphStoresContainer } from "../../state/storesContainer";
import { Data } from "../../api/dataTypes";

// Resolves once every node from this call has been drained from the pending queue
// (processed over the following ticks by processPendingData). Requires the ticker
// to be running; disposing the instance settles the promise early.
export function addData($states: GraphStoresContainer, data: Data): Promise<void> {
    if (data.nodes) $states.context.pendingNodes.push(...data.nodes);
    if (data.edges) $states.context.pendingEdges.push(...data.edges);

    const ids = data.nodes?.map(n => n.id) ?? [];
    return new Promise<void>(resolve => {
        // Always push — even for empty node lists (pendingIds will be an empty Set),
        // processPendingData resolves it on the next tick rather than synchronously here.
        $states.context.addTrackers.push({ pendingIds: new Set(ids), callback: resolve });
    });
}
