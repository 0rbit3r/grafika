// Note: diverges from BE (FdlLayoutService.cs) — ideal edge length is scaled by total edge count here
// vs target node size on BE; pull force divisor uses total edge count here vs backlink count on BE.
import {
    MOMENTUM_DAMPENING_START_AT, MOMENTUM_DAMPENING_EASE_IN_FRAMES, MAX_MOMENTUM_DAMPENING,
    MAX_MOVEMENT_SPEED, GRAVITY_FREE_RADIUS, gravityForce,
    edgesNumForceDivisor,
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
    DOWNFLOW_FORCE,
    EDGE_COUNT_EDGE_LENGTH_INFLUENCE_FACTOR
} from "../core/defaultGraphOptions";
import { RenderedEdge } from "../core/renderedEdge";
import { RenderedNode } from "../core/renderedNode";
import { GraphStoresContainer } from "../state/storesContainer";
import { buildQuadTree, cellMinDist, QuadCell } from "./quadtree";

export const get_border_distance = (node1: RenderedNode, node2: RenderedNode) => {
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    const centerDistance = Math.hypot(dx, dy);
    return centerDistance - node1.radius - node2.radius;
};

const get_center_distance = (node1: RenderedNode, node2: RenderedNode) => {
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    const dist = Math.hypot(dx, dy);

    // prevents division by zero (?)
    return dist === 0 ? 0.01 : dist;
}

export const simulate_one_frame_of_FDL = ($states: GraphStoresContainer) => {
    const $simulationState = $states.simulation;
    const renderedNodes = [...$states.context.renderedNodes.values()];
    const frame = $simulationState.frame;
    const $context = $states.context;

    $states.context.renderedEdges.forEach(e => {
        if (e.source.framesAlive < 0 || e.target.framesAlive < 0
            || e.source.timeToLiveTo !== undefined || e.target.timeToLiveTo !== undefined)
            return;
        pull_or_push_connected_to_ideal_distance(e, $states);
    });

    const activeNodes = renderedNodes.filter(n => n.framesAlive >= 0 && n.timeToLiveTo === undefined);
    const root = buildQuadTree(activeNodes);

    renderedNodes.forEach(n1 => {
        if (n1.framesAlive < 0 || n1.timeToLiveTo !== undefined) return;
        handleOutOfBounds(n1);
        if (root) queryPush(root, n1, $simulationState.pushThreshold, $states);
        if ($simulationState.gravityEnabled) {
            gravity_pull(n1);
        }
    });

    renderedNodes.forEach(node => {
        // I'm gonna be honest, I don't really understand what's going on down from here...
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

        // to spare cpu the sqrt unless in the square of allowed movement speed
        const momentumSq = node.momentum.x ** 2 + node.momentum.y ** 2;
        if (momentumSq > MAX_MOVEMENT_SPEED ** 2) {
            const totalMomentum = Math.sqrt(momentumSq);
            node.momentum.x = MAX_MOVEMENT_SPEED * (node.momentum.x / totalMomentum);
            node.momentum.y = MAX_MOVEMENT_SPEED * (node.momentum.y / totalMomentum);
        }
        node.x += node.momentum.x;
        node.y += node.momentum.y;

        node.forces.x /= frameAdjustedDampeningRate;
        node.forces.y /= frameAdjustedDampeningRate;
    });
}

export const pull_or_push_connected_to_ideal_distance = (edge: RenderedEdge, $states: GraphStoresContainer) => {
    const simState = $states.simulation;

    const dx = edge.target.x - edge.source.x
    const dy = edge.target.y - edge.source.y;
    const centerDistance = get_center_distance(edge.source, edge.target);
    const borderDistance = get_border_distance(edge.source, edge.target);

    const sizeAffectedLength = edge.length
        * Math.max(1,
            (edge.target.inEdges.size + edge.target.outEdges.size
                + edge.source.inEdges.size + edge.source.outEdges.size)
            * EDGE_COUNT_EDGE_LENGTH_INFLUENCE_FACTOR)

    const force = pullForce(borderDistance, sizeAffectedLength)
        * edge.weight
        / edgesNumForceDivisor(edge.target.inEdges.size + edge.target.outEdges.size + edge.source.inEdges.size + edge.source.outEdges.size);

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
    edge.source.forces.y += (edge.source.held ? 0 : (dy / centerDistance) * force - (simState.downflowEnabled ? DOWNFLOW_FORCE : 0))
        * nodeMassMultiplier
        * sourceNodeTimeOnScreenMultiplier;
    edge.target.forces.x -= (edge.target.held ? 0 : (dx / centerDistance) * force)
        / nodeMassMultiplier
        * targetNodeTimeOnScreenMultiplier;
    edge.target.forces.y -= (edge.target.held ? 0 : (dy / centerDistance) * force - (simState.downflowEnabled ? DOWNFLOW_FORCE : 0))
        / nodeMassMultiplier
        * targetNodeTimeOnScreenMultiplier;
}

export const push_unconnected = (sourceNode: RenderedNode, targetNode: RenderedNode, $states: GraphStoresContainer) => {

    const $sim = $states.simulation;
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const centerDistance = get_center_distance(sourceNode, targetNode);
    const borderDistance = get_border_distance(sourceNode, targetNode);

    // const force = borderDistance < 0 && useGraphStore.getState().frame > FRAMES_WITH_OVERLAP
    //     ? -borderDistance
    //     : pushForce(centerDistance);
    // const force = pushForce(centerDistance);


    //this might be a bit weird but hey... it works to eliminate the noncontinuity of the push force at the edge
    const forceAtPushThresh = pushForce($sim.pushThreshold);
    const force = sourceNode.framesAlive > FRAMES_WITH_OVERLAP && targetNode.framesAlive > FRAMES_WITH_OVERLAP
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

// One-sided push: applies force only to `node` (not `other`).
// The full loop calls this for every (node, other) pair from node's perspective,
// so each node accumulates its correct total push force without double-counting.
const push_force_on_node = (node: RenderedNode, other: RenderedNode, $states: GraphStoresContainer) => {
    const $sim = $states.simulation;
    const dx = other.x - node.x;
    const dy = other.y - node.y;
    const centerDistance = get_center_distance(node, other);
    const borderDistance = get_border_distance(node, other);

    const forceAtPushThresh = pushForce($sim.pushThreshold);
    const force = node.framesAlive > FRAMES_WITH_OVERLAP && other.framesAlive > FRAMES_WITH_OVERLAP
        ? pushForce(borderDistance) - forceAtPushThresh
        : 0;

    const nodeMassMultiplier = NODE_MASS_ON
        ? Math.min(Math.max(other.radius / node.radius, MIN_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER), MAX_MASS_DIFFERENCE_PUSH_FORCE_MULTIPLIER)
        : 1;

    const timeMultiplier = other.framesAlive < FRAMES_WITH_NO_INFLUENCE
        ? 0
        : Math.min(1, (other.framesAlive - FRAMES_WITH_NO_INFLUENCE) / INFLUENCE_FADE_IN);

    node.forces.x -= (node.held ? 0 : (dx / centerDistance) * force) * nodeMassMultiplier * timeMultiplier;
    node.forces.y -= (node.held ? 0 : (dy / centerDistance) * force) * nodeMassMultiplier * timeMultiplier;
};

function queryPush(cell: QuadCell, node: RenderedNode, pushThreshold: number, $states: GraphStoresContainer): void {
    if (cellMinDist(cell, node.x, node.y) - node.radius > pushThreshold) return;

    if (cell.nw === null) {
        if (cell.node === null || cell.node === node) return;
        const other = cell.node;
        if (node.adjacentNodeIds.has(other.id)) return;
        if (get_border_distance(node, other) < pushThreshold) {
            push_force_on_node(node, other, $states);
        }
        return;
    }
    queryPush(cell.nw, node, pushThreshold, $states);
    queryPush(cell.ne!, node, pushThreshold, $states);
    queryPush(cell.sw!, node, pushThreshold, $states);
    queryPush(cell.se!, node, pushThreshold, $states);
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
