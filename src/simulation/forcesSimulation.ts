import {
    PUSH_THRESH, MOMENTUM_DAMPENING_START_AT, MOMENTUM_DAMPENING_EASE_IN_FRAMES, MAX_MOMENTUM_DAMPENING,
    MAX_MOVEMENT_SPEED, GRAVITY_FREE_RADIUS, gravityForce,
    backlinksNumberForceDivisor,
    FRAMES_WITH_NO_INFLUENCE,
    INFLUENCE_FADE_IN,
    MAX_MASS_DIFFERENCE_PULL_FORCE_MULTIPLIER,
    MIN_MASS_DIFFERENCE_PULL_FORCE_MULTIPLIER,
    NODE_MASS_ON,
    pullForce,
    FRAMES_WITH_OVERLAP,
    MAX_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER,
    MIN_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER,
    pushForce
} from "../core/defaultGraphOptions";
import { RenderedEdge } from "../core/renderedEdge";
import { RenderedNode } from "../core/renderedNode";
import { GraphStoresContainer } from "../state/storesContainer";

export const get_border_distance = (node1: RenderedNode, node2: RenderedNode) => {
    const x1 = node1.x;
    const y1 = node1.y;
    const x2 = node2.x;
    const y2 = node2.y;
    const centerDistance = Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
    const borderDistance = centerDistance - node1.radius - node2.radius;
    // if (borderDistance > centerDistance) {
    //     return borderDistance - 
    // }

    return borderDistance;
}

const get_center_distance = (node1: RenderedNode, node2: RenderedNode) => {
    const x1 = node1.x;
    const y1 = node1.y;
    const x2 = node2.x;
    const y2 = node2.y;

    const dist = Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));

    // prevents division by zero (?)
    return dist === 0 ? 0.01 : dist;
}

export const simulate_one_frame_of_FDL = ($states: GraphStoresContainer) => {
    const $simulationState = $states.simulation.get();
    const renderedNodes = $states.context.get().renderedNodes;
    const frame = $simulationState.frame;

    // console.log("simulating frame - renderedEdges: " +
    //     JSON.stringify($states.context.get().renderedEdges.map(e => {return {source: e.source.id, target: e.target.id, color: e.color}})));

    $states.context.get().renderedEdges.forEach(e => {
        pull_or_push_connected_to_ideal_distance(e, $states);
    });

    for (let i = 0; i < renderedNodes.length; i++) {
        const node1 = renderedNodes[i];
        handleOutOfBounds(node1);
        for (let j = 0; j < i; j++) {
            const node2 = renderedNodes[j];
            const borderDistance = get_border_distance(node1, node2);
            if (borderDistance < PUSH_THRESH
                && node1.edges.filter(e => (e.target === node2 && e.source === node1)
                    || (e.source === node2 && e.target === node1)).length === 0) { //todo - another performance bottleneck with filter
                // console.log("pushing: " + node1.id + " " + node2.id);
                push_unconnected(node1, node2, $states);
            }
        }
        if ($simulationState.gravityEnabled) {
            gravity_pull(node1);
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

        // console.log("frameAdjustedDampeningRate: ", frameAdjustedDampeningRate);

        node.momentum.x /= frameAdjustedDampeningRate;
        node.momentum.y /= frameAdjustedDampeningRate;

        // node.momentum.x = Math.min(node.momentum.x, MAX_MOMENTUM);
        // node.momentum.y = Math.min(node.momentum.y, MAX_MOMENTUM);

        node.x += Math.max(Math.min(node.momentum.x, MAX_MOVEMENT_SPEED), -MAX_MOVEMENT_SPEED); // not taking angle into account...
        node.y += Math.max(Math.min(node.momentum.y, MAX_MOVEMENT_SPEED), -MAX_MOVEMENT_SPEED); // not taking angle into account...

        node.forces.x /= frameAdjustedDampeningRate;
        node.forces.y /= frameAdjustedDampeningRate;
    });
}

export const pull_or_push_connected_to_ideal_distance = (edge: RenderedEdge, $states: GraphStoresContainer) => {
    const simState = $states.simulation.get();

    const dx = edge.target.x - edge.source.x;
    const dy = edge.target.y - edge.source.y;
    const centerDistance = get_center_distance(edge.source, edge.target);
    const borderDistance = get_border_distance(edge.source, edge.target);
    // const borderDistance = get_border_distance(sourceNode, targetNode);
    // if (borderDistance < 0) {
    //     return;
    // }

    const force = pullForce(borderDistance, simState.edgeLength)
        / backlinksNumberForceDivisor(edge.target.edges.filter(e => e.target.id === edge.target.id).length) //todo check the logic + potential bottleneck?

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

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const centerDistance = get_center_distance(sourceNode, targetNode);
    const borderDistance = get_border_distance(sourceNode, targetNode);

    // const force = borderDistance < 0 && useGraphStore.getState().frame > FRAMES_WITH_OVERLAP
    //     ? -borderDistance
    //     : pushForce(centerDistance);
    // const force = pushForce(centerDistance);

    const forceAtPushThresh = pushForce(PUSH_THRESH); //this might be a bit weird but hey... it works to eliminate the noncontinuity of the push force at the edge

    const force = $states.simulation.get().frame > FRAMES_WITH_OVERLAP
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
