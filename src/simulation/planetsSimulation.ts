// import { XAndY } from "../api/dataTypes";
// import { RenderedEdge } from "../core/renderedEdge";
// import { RenderedNode } from "../core/renderedNode";
// import { GraphStoresContainer } from "../state/storesContainer";


// const getVelocities = (node1: RenderedNode, node2: RenderedNode) => {

// }


// export const simulate_one_frame_of_FDL = ($states: GraphStoresContainer) => {

//     //validateGalaxyData($states.context.RenderedNodes)

//     simulate_one_frame_of_FDL($states);

//     $states.context.renderedNodes.forEach(node => {
//         // its parent is bigger and thus should be orbited around
//         // the parent should orbit t0o - create barycenter

//         const parentEdge = Array.from(node.inEdges)[0];
//         if (!parentEdge) return;
//         const baryCenter = computeBaryRelativeToSource(parentEdge);
//         //todo
    
//         // either real gravity simulation or a simplified version, where forces act in paralel
//         // with sensible ratio (barycenter always inside source node?)
//         // also do two passes - first to compute forces, then update x and
//         parentEdge.source.forces = {x: parentEdge.source.x , y: 1} //+ todo calculate paralel force or compute arc?

//     });
// }

// const computeBaryRelativeToSource = (edge: RenderedEdge) => {
//     const biggerNode = edge.source.radius >= edge.target.radius
//         ? edge.source
//         : edge.target;
//     const smallerNode = edge.source.radius < edge.target.radius
//         ? edge.source
//         : edge.target;
//     return biggerNode.radius / (smallerNode.radius + biggerNode.radius);
// }
