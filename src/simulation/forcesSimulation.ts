import { NodeShape } from "../api/dataTypes";
import {
    MOMENTUM_DAMPENING_START_AT, MOMENTUM_DAMPENING_EASE_IN_FRAMES, MAX_MOMENTUM_DAMPENING,
    MAX_MOVEMENT_SPEED, GRAVITY_FREE_RADIUS, gravityForce,
    inEdgesLengthForceDivisor,
    FRAMES_WITH_NO_INFLUENCE,
    INFLUENCE_FADE_IN,
    MAX_MASS_DIFFERENCE_PULL_FORCE_MULTIPLIER,
    MIN_MASS_DIFFERENCE_PULL_FORCE_MULTIPLIER,
    NODE_MASS_ON,
    pullForce,
    FRAMES_WITH_OVERLAP,
    MAX_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER,
    MIN_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER,
    pushForce,
    TEXT_BOX_NODE_WIDTH_MULTIPLIER
} from "../core/defaultGraphOptions";
import { RenderedEdge } from "../core/renderedEdge";
import { RenderedNode } from "../core/renderedNode";
import { GraphStoresContainer } from "../state/storesContainer";

// makes text box nodes more repellent horizontally 
function anisotropic_dx(node1: RenderedNode, node2: RenderedNode) {
    let dx = node1.x - node2.x;
    // if either is a textbox, shrink dx so the distance grows faster in x
    if (node1.shape === NodeShape.TextBox || node2.shape === NodeShape.TextBox) {
        dx /= TEXT_BOX_NODE_WIDTH_MULTIPLIER;
    }
    return dx;
}

export const get_border_distance = (node1: RenderedNode, node2: RenderedNode) => {
    const dx = anisotropic_dx(node1, node2);
    const dy = node1.y - node2.y;
    const centerDistance = Math.hypot(dx, dy);
    return centerDistance - node1.radius - node2.radius;
};

const get_center_distance = (node1: RenderedNode, node2: RenderedNode) => {
    const dx = anisotropic_dx(node1, node2);
    const dy = node1.y - node2.y;
    const dist = Math.hypot(dx, dy);

    // prevents division by zero (?)
    return dist === 0 ? 0.01 : dist;
}

export const simulate_one_frame_of_FDL = ($states: GraphStoresContainer) => {
    const $simulationState = $states.simulation.get();
    const renderedNodes = $states.context.get().renderedNodes;
    const frame = $simulationState.frame;
    const $context = $states.context.get();

    $states.context.get().renderedEdges.forEach(e => {
        pull_or_push_connected_to_ideal_distance(e, $states);
    });

    for (let node1Index = 0; node1Index < renderedNodes.length; node1Index++) {
        handleOutOfBounds(renderedNodes[node1Index]);
        for (let node2Index = 0; node2Index < node1Index; node2Index++) {
            const borderDistance = get_border_distance(renderedNodes[node1Index], renderedNodes[node2Index]);
            if (borderDistance < $simulationState.pushThreshold
                && !$context.edgesAdjacency.get(renderedNodes[node1Index].id)?.has(renderedNodes[node2Index].id)) {
                push_unconnected(renderedNodes[node1Index], renderedNodes[node2Index], $states);
            }
        }
        if ($simulationState.gravityEnabled) {
            gravity_pull(renderedNodes[node1Index]);
        }
    }

    renderedNodes.forEach(node => {
        node.framesAlive += 1;
        // I'm gonna be honest, I don't really understandwhat's going on down from here...
        if (Math.abs(node.momentum.x) < Math.abs(node.forces.x)) {
            node.momentum.x = Math.abs(node.momentum.x) * Math.sign(node.forces.x);
        }
        if (Math.abs(node.momentum.y) < Math.abs(node.forces.y)) {
            node.momentum.y = Math.abs(node.momentum.y) * Math.sign(node.forces.y);
        }

        node.momentum.x += node.forces.x;
        node.momentum.y += node.forces.y;

        const frameAdjustedDampeningRate =
            MOMENTUM_DAMPENING_START_AT +
            Math.min(frame, MOMENTUM_DAMPENING_EASE_IN_FRAMES) / MOMENTUM_DAMPENING_EASE_IN_FRAMES * (MAX_MOMENTUM_DAMPENING - MOMENTUM_DAMPENING_START_AT);


        node.momentum.x /= frameAdjustedDampeningRate;
        node.momentum.y /= frameAdjustedDampeningRate;

        node.x += Math.max(Math.min(node.momentum.x, MAX_MOVEMENT_SPEED), -MAX_MOVEMENT_SPEED); // not taking angle into account...
        node.y += Math.max(Math.min(node.momentum.y, MAX_MOVEMENT_SPEED), -MAX_MOVEMENT_SPEED); // not taking angle into account...

        node.forces.x /= frameAdjustedDampeningRate;
        node.forces.y /= frameAdjustedDampeningRate;
    });
}

export const pull_or_push_connected_to_ideal_distance = (edge: RenderedEdge, $states: GraphStoresContainer) => {
    const simState = $states.simulation.get();

    const dx = edge.target.x - edge.source.x
    const dy = edge.target.y - edge.source.y;
    const centerDistance = get_center_distance(edge.source, edge.target);
    const borderDistance = get_border_distance(edge.source, edge.target);

    const force = pullForce(borderDistance, simState.defaultEdgeLength)
        / inEdgesLengthForceDivisor(edge.target.inEdges.size); //todo check the logic + potential bottleneck?

    const nodeMassMultiplier = NODE_MASS_ON
        ? Math.min(Math.max(edge.target.radius / edge.source.radius, MIN_MASS_DIFFERENCE_PULL_FORCE_MULTIPLIER), MAX_MASS_DIFFERENCE_PULL_FORCE_MULTIPLIER)
        : 1;

    const sourceNodeTimeOnScreenMultiplier = edge.target.framesAlive < FRAMES_WITH_NO_INFLUENCE
        ? 0
        : Math.min(1, (edge.target.framesAlive - FRAMES_WITH_NO_INFLUENCE) / INFLUENCE_FADE_IN);

    const targetNodeTimeOnScreenMultiplier = edge.source.framesAlive < FRAMES_WITH_NO_INFLUENCE
        ? 0
        : Math.min(1, (edge.source.framesAlive - FRAMES_WITH_NO_INFLUENCE) / INFLUENCE_FADE_IN);

    // get the x / y component of the force vector and multiply by the scalar compponent;
    edge.source.forces.x += (edge.source.held ? 0 : (dx / centerDistance) * force)
        * nodeMassMultiplier
        * sourceNodeTimeOnScreenMultiplier;
    edge.source.forces.y += (edge.source.held ? 0 : (dy / centerDistance) * force - (simState.upflowEnabled ? 2 : 0))
        * nodeMassMultiplier
        * sourceNodeTimeOnScreenMultiplier;
    edge.target.forces.x -= (edge.target.held ? 0 : (dx / centerDistance) * force)
        / nodeMassMultiplier
        * targetNodeTimeOnScreenMultiplier;
    edge.target.forces.y -= (edge.target.held ? 0 : (dy / centerDistance) * force - (simState.upflowEnabled ? 2 : 0))
        / nodeMassMultiplier
        * targetNodeTimeOnScreenMultiplier;
}

export const push_unconnected = (sourceNode: RenderedNode, targetNode: RenderedNode, $states: GraphStoresContainer) => {

    const $sim = $states.simulation.get();
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const centerDistance = get_center_distance(sourceNode, targetNode);
    const borderDistance = get_border_distance(sourceNode, targetNode);

    // const force = borderDistance < 0 && useGraphStore.getState().frame > FRAMES_WITH_OVERLAP
    //     ? -borderDistance
    //     : pushForce(centerDistance);
    // const force = pushForce(centerDistance);

    const forceAtPushThresh = pushForce($sim.pushThreshold); //this might be a bit weird but hey... it works to eliminate the noncontinuity of the push force at the edge

    const force = $sim.frame > FRAMES_WITH_OVERLAP
        ? pushForce(borderDistance) - forceAtPushThresh
        : 0;

    const nodeMassMultiplier = NODE_MASS_ON
        ? Math.min(Math.max(targetNode.radius / sourceNode.radius, MIN_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER), MAX_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER)
        : 1;

    const sourceNodeTimeOnScreenMultiplier = targetNode.framesAlive < FRAMES_WITH_NO_INFLUENCE
        ? 0
        : Math.min(1, (targetNode.framesAlive - FRAMES_WITH_NO_INFLUENCE) / INFLUENCE_FADE_IN);

    const targetNodeTimeOnScreenMultiplier = sourceNode.framesAlive < FRAMES_WITH_NO_INFLUENCE
        ? 0
        : Math.min(1, (sourceNode.framesAlive - FRAMES_WITH_NO_INFLUENCE) / INFLUENCE_FADE_IN);

    sourceNode.forces.x -= (sourceNode.held ? 0 : (dx / centerDistance) * force)
        * nodeMassMultiplier
        * sourceNodeTimeOnScreenMultiplier;
    sourceNode.forces.y -= (sourceNode.held ? 0 : (dy / centerDistance) * force)
        * nodeMassMultiplier
        * sourceNodeTimeOnScreenMultiplier;
    targetNode.forces.x += (targetNode.held ? 0 : (dx / centerDistance) * force)
        / nodeMassMultiplier
        * targetNodeTimeOnScreenMultiplier;
    targetNode.forces.y += (targetNode.held ? 0 : (dy / centerDistance) * force)
        / nodeMassMultiplier
        * targetNodeTimeOnScreenMultiplier;
}

// Adds force pulling the node towards the center of the graph
export const gravity_pull = (node: RenderedNode) => {
    if (node.held) {
        return;
    }
    const dx = node.x;
    const dy = node.y;
    const centerDistance = Math.sqrt(dx * dx + dy * dy);
    if (centerDistance < GRAVITY_FREE_RADIUS) {
        return;
    }

    const framesAliveMultiplier = node.framesAlive < FRAMES_WITH_NO_INFLUENCE
        ? 0
        : Math.min(1, (node.framesAlive - FRAMES_WITH_NO_INFLUENCE) / INFLUENCE_FADE_IN);

    const force = gravityForce(centerDistance) * framesAliveMultiplier;

    const forceX = force * (dx / centerDistance);
    const forceY = force * (dy / centerDistance);

    node.forces.x += forceX;
    node.forces.y += forceY;
}

const handleOutOfBounds = (node: RenderedNode) => {
    if (node.x === undefined || node.y === undefined) {
        console.log("node out of bounds: ", node.id);
        node.x = 0;
        node.y = 0;
    }
}

// const handleOutOfBorders = (node: RenderedNode) => {
//     if (node.x < node.radius) {
//         node.x = node.radius;
//     }
//     if (node.x > SIM_WIDTH - node.radius) {
//         node.x = SIM_WIDTH - node.radius;
//     }
//     if (node.y < node.radius) {
//         node.y = node.radius;
//     }
//     if (node.y > SIM_HEIGHT - node.radius) {
//         node.y = SIM_HEIGHT - node.radius;
//     }
// }
