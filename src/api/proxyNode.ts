import { RenderedNode } from "../core/renderedNode";
import { NodeInit, NodeShape } from "./dataTypes";
import { GraphStoresContainer } from "../state/storesContainer";
// import { drawNode } from "../graphics/drawNode";
import { getEdgeProxy, ProxyEdge } from "./proxyEdge";
import { mapSet } from "../util/mapSet";
import { initNodeGraphics } from "../graphics/initNodeGraphics";
import { handleNodeLoading } from "../graphics/dynamicLoader";

export interface ProxyNode {
    id: number;

    x: number;
    y: number;

    color: string;
    radius: number;
    shape: NodeShape;
    text: string;

    hollowEffect: boolean;
    glowEffect: boolean;
    blinkEffect: boolean;

    inEdges: Set<ProxyEdge>; //edges are readonly - modifying this array will not change anything
    outEdges: Set<ProxyEdge>;
}

const allowedSetWithRedraw = new Set(["color", "radius", "shape", "text", "hollowEffect", "glowEffect", "blinkEffect"])
const allowedSet = new Set([...allowedSetWithRedraw, "x", "y",]);
const allowedGet = new Set([...allowedSet, "id", "inEdges", "outEdges"]);

export function getNodeProxy(n: RenderedNode, states: GraphStoresContainer): ProxyNode {
    let p = states.context.get().proxyNodesMap.get(n);
    if (!p) {
        p = createNodeProxy(n, states);
        states.context.get().proxyNodesMap.set(n, p);
    }
    return p;
}

function createNodeProxy(target: RenderedNode, $states: GraphStoresContainer): ProxyNode {
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
                if (allowedSetWithRedraw.has(prop as string)){
                    initNodeGraphics(target, $states);
                    handleNodeLoading(target, $states.graphics.get())
                }
                return true;
            }
            console.error(`property ${prop as string} cannot be modified on the GraphProxyNode.`);
            return false;
        }
    }) as ProxyNode;
}