import { checkMaxIfStatementsInShader } from "pixi.js";
import { Data } from "../../api/dataTypes";
import { GraphStoresContainer } from "../../state/storesContainer";
import { filterInPlace } from "../../util/filterInPlace";
import { RenderedEdge } from "../renderedEdge";

//todo - this might be made faster by using sets?

export function removeDataByIds($states: GraphStoresContainer, dataToRemove: Data) {
    if (dataToRemove.nodes === undefined) dataToRemove.nodes = [];
    if (dataToRemove.edges === undefined) dataToRemove.edges = [];

    // todo - remove from:
    // [x] rendered lists 
    // [x] notrendered list of edges in place
    // [x] individual nodes' edge lists
    // [x] proxylists
    // [x] adjacencymap
    // [x] destroy sprites and unsubscribe event listeners

    // then check my sanity nd try to find a better architecture than this...

    // remove nodes and dispose their graphics
    const nodesToDestroy = $states.context.renderedNodes.filter(existingNode =>
        (dataToRemove.nodes?.find(n => n.id === existingNode.id)));

    $states.context.renderedNodes =
        $states.context.renderedNodes.filter(n => !nodesToDestroy.includes(n));

    const edgesToDestroy: Set<RenderedEdge> = new Set();
    nodesToDestroy.forEach(node => {
        node.sprite?.removeAllListeners();
        node.sprite?.destroy({children: true});
        node.renderedText?.destroy({children: true});
        // remove deleted edges from nodes' references
        node.inEdges.forEach(e => edgesToDestroy.add(e));
        node.outEdges.forEach(e => edgesToDestroy.add(e));
    });

    // remove edges requested to delete
    dataToRemove.edges?.forEach(e => {
        const renderedEdge = $states.context.renderedEdges.find(
            re => re.source.id === e.sourceId && re.target.id === e.targetId
        );
        if (renderedEdge) edgesToDestroy.add(renderedEdge);
    });


    $states.context.renderedEdges =
        $states.context.renderedEdges.filter(e => !edgesToDestroy.has(e));

    edgesToDestroy.forEach(e => {
        e.sprite?.destroy({children: true});
        e.target.inEdges.delete(e);
        e.source.outEdges.delete(e);

        $states.context.edgesAdjacency.get(e.source.id)?.delete(e.target.id);
        $states.context.edgesAdjacency.get(e.target.id)?.delete(e.source.id);
    });

    // remove stale notRenderedEdges and notRenderedEdges requested for removal
    filterInPlace($states.context.notRenderedEdges,
        ne =>
            dataToRemove.edges?.find(e => e.sourceId === ne.sourceId && e.targetId === ne.targetId) === undefined // edge is not in requested removal
    );

    filterInPlace($states.context.proxyEdgesList,
        re => dataToRemove.edges?.find(e => e.sourceId === re.sourceId && e.targetId === re.targetId) === undefined // edge is not in requested removal
            && ($states.context.renderedNodes.find(n => n.id === re.sourceId || n.id === re.targetId) !== undefined));// egde is referenced by a node);

    filterInPlace($states.context.proxyNodesList,
        rn => dataToRemove.nodes?.find(n => rn.id === n.id) === undefined);
    
}