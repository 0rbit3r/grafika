import { RenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";

export function destroyExpired($states: GraphStoresContainer) {
    const expiredNodes = new Set<RenderedNode>();
    for (const n of $states.context.renderedNodes.values()) {
        if (n.timeToLiveTo !== undefined && n.framesAlive >= n.timeToLiveTo) {
            n.sprite?.destroy({ children: true });
            n.renderedText?.destroy({ children: true });
            // Guard: only delete if the map still points to this dying node, not a
            // replacement node with the same ID added while this one was fading out.
            if ($states.context.renderedNodes.get(n.id) === n)
                $states.context.renderedNodes.delete(n.id);
            expiredNodes.add(n);
        }
    }
    if (expiredNodes.size > 0) {
        for (const [key, e] of $states.context.renderedEdges) {
            if (expiredNodes.has(e.source) || expiredNodes.has(e.target)) {
                e.sprite?.destroy({ children: true });
                $states.context.renderedEdges.delete(key);
                if (!expiredNodes.has(e.target)) e.target.inEdges.delete(e);
                if (!expiredNodes.has(e.source)) e.source.outEdges.delete(e);
            }
        }

        // Drain removeTracker IDs; processPendingData will fire callbacks on the next tick
        $states.context.removeTrackers.forEach(tracker =>
            expiredNodes.forEach(n => tracker.pendingIds.delete(n.id))
        );
    }
}
