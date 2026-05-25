import { RenderedNode } from "../renderedNode";
import { GraphStoresContainer } from "../../state/storesContainer";
import { filterInPlace } from "../../util/filterInPlace";

export function destroyExpired($states: GraphStoresContainer) {
    const expiredNodes = new Set<RenderedNode>();
    $states.context.renderedNodes = $states.context.renderedNodes.filter(n => {
        if (n.timeToLiveTo !== undefined && n.framesAlive >= n.timeToLiveTo) {
            n.sprite?.destroy({ children: true });
            n.renderedText?.destroy({ children: true });
            // Guard: only delete if the map still points to this dying node, not a
            // replacement node with the same ID added while this one was fading out.
            if ($states.context.nodesById.get(n.id) === n)
                $states.context.nodesById.delete(n.id);
            expiredNodes.add(n);
            return false;
        }
        return true;
    });
    if (expiredNodes.size > 0) {
        $states.context.renderedEdges = $states.context.renderedEdges.filter(e => {
            if (expiredNodes.has(e.source) || expiredNodes.has(e.target)) {
                e.sprite?.destroy({ children: true });
                $states.context.edgesById.delete(`${e.source.id}->${e.target.id}`);
                if (!expiredNodes.has(e.target)) e.target.inEdges.delete(e);
                if (!expiredNodes.has(e.source)) e.source.outEdges.delete(e);
                return false;
            }
            return true;
        });

        filterInPlace($states.context.removeTrackers, tracker => {
            expiredNodes.forEach(n => tracker.pendingIds.delete(n.id));
            if (tracker.pendingIds.size === 0) { tracker.callback(); return false; }
            return true;
        });
    }
}
