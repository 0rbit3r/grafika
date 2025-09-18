import { RenderedNode } from "../core/renderedNode";
import { GraphNodeInit, NodeShape } from "./dataTypes";
import { GraphStoresContainer } from "../state/storesContainer";
// import { drawNode } from "../graphics/drawNode";
import { getEdgeProxy, GraphProxyEdge } from "./proxyEdge";
import { mapSet } from "../util/mapSet";
import { initNodeGraphics } from "../graphics/initNodeGraphics";

export interface GraphProxyNode {
    id: number;

    x: number;
    y: number;

    color: string;
    radius: number;
    shape: NodeShape;
    title: string;

    hollowEffect: boolean;
    glowEffect: boolean;
    blinkEffect: boolean;

    inEdges: Set<GraphProxyEdge>; //edges are readonly - modifying this array will not change anything
    outEdges: Set<GraphProxyEdge>;
}

const allowedSetWithRedraw = new Set(["color", "radius", "shape", "title", "hollowEffect", "glowEffect", "blinkEffect"])
const allowedSet = new Set([...allowedSetWithRedraw, "x", "y",]);
const allowedGet = new Set([...allowedSet, "id", "inEdges", "outEdges"]);

export function getNodeProxy(n: RenderedNode, states: GraphStoresContainer): GraphProxyNode {
    let p = states.context.get().proxyNodesMap.get(n);
    if (!p) {
        p = createNodeProxy(n, states);
        states.context.get().proxyNodesMap.set(n, p);
    }
    return p;
}

function createNodeProxy(target: RenderedNode, $states: GraphStoresContainer): GraphProxyNode {
    return new Proxy(target as any, {
        get(_, prop) {
            if (allowedGet.has(prop as string)) {
                if (prop === "inEdges")
                    return mapSet(target.inEdges, e => getEdgeProxy(e, $states));
                if (prop === "outEdges")
                    return mapSet(target.outEdges, e => getEdgeProxy(e, $states));
                return (target as any)[prop];
            }
            console.error(`property ${prop as string} cannot be accessed on the GraphProxyNode.`);
        },
        set(_, prop, value) {
            if (allowedSet.has(prop as string)) {
                (target as any)[prop] = value;
                if (allowedSetWithRedraw.has(prop as string))
                    initNodeGraphics(target, $states);
                return true;
            }
            console.error(`property ${prop as string} cannot be modified on the GraphProxyNode.`);
            return false;
        }
    }) as GraphProxyNode;
}

export const testProxy = ($states: GraphStoresContainer) => {
    const firstNode = $states.context.get().renderedNodes[0];

    const exposedNode = createNodeProxy(firstNode, $states);
    console.log(exposedNode);
    console.log(exposedNode.shape);
    console.log(exposedNode.color);
    setTimeout(() => exposedNode.color = "#ff0000", 1000);
    setTimeout(() => exposedNode.x = 0, 2000);
    setTimeout(() => exposedNode.radius = 300, 3000);
    setTimeout(() => exposedNode.shape = NodeShape.Diamond, 4000);
    setTimeout(() => exposedNode.glowEffect = true, 5000);
    setTimeout(() => exposedNode.hollowEffect = true, 6000);
}