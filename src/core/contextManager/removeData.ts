import { GraphDataProxy } from "../../api/controlTypes";
import { GraphDataInit } from "../../api/dataTypes";
import { GraphStoresContainer } from "../../state/storesContainer";

// Removes data based on ids - other fields are ignored
export function removeData($states: GraphStoresContainer, dataToRemove: GraphDataInit) {

    //todo - this might be made faster by using sets

    const nodesToDestroy = $states.context.get().renderedNodes.filter(existingNode =>
        (dataToRemove.nodes.find(n => n.id === existingNode.id)));


    $states.context.setKey("renderedNodes",
        $states.context.get().renderedNodes.filter(n => !nodesToDestroy.includes(n)));

    nodesToDestroy.forEach(n => n.graphics.destroy());

    // remove stale notRenderedEdges and notRenderedEdges requested for removal
    $states.context.setKey("notRenderedEdges",
        $states.context.get().notRenderedEdges.filter(ne =>
            !(dataToRemove.edges.find(e => e.sourceId === ne.sourceId && e.targetId === ne.targetId)) // edge is not in requested removal
            && $states.context.get().renderedNodes.find(n => n.id === ne.sourceId || n.id === ne.targetId) // egde is referenced by a node
        ));

    const edgesToDestroy = $states.context.get().renderedEdges.filter(re =>
        (dataToRemove.edges.find(e => e.sourceId === re.source.id && e.targetId === re.target.id)) // edge is in requested removal
        || !$states.context.get().renderedNodes.find(n => n.id === re.source.id || n.id === re.target.id) // egde is not referenced by a node
    );

    $states.context.setKey("renderedEdges",
        $states.context.get().renderedEdges.filter(e => !edgesToDestroy.includes(e)));

    edgesToDestroy.forEach(e => e.graphics.destroy());
}