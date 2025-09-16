import { RenderedNode } from "../core/renderedNode";
import { EdgeType, GraphEdgeInit, GraphNodeInit, NodeShape } from "./dataTypes";
import { GraphStoresContainer } from "../state/storesContainer";
import { drawNode } from "../graphics/drawNode";
import { RenderedEdge } from "../core/renderedEdge";
import { drawEdge } from "../graphics/drawEdge";
import { Graphics } from "pixi.js";
import { getNodeProxy, GraphProxyNode } from "./proxyNode";

export interface GraphProxyEdge {
    // same as RenderedEdge - fall through
    color: string;
    type: EdgeType;
    weight: number;

    // different than renderedEdge - require traps
    source: GraphProxyNode;
    target: GraphProxyNode;
    sourceId: number;
    targetId: number;
}

const allowedSetWithRedraw = new Set(["color", "type"]);
const allowedSet = new Set([...allowedSetWithRedraw, "weight"]);
const allowedGet = new Set([...allowedSet, "source", "target", "sourceId", "targetId"]);

export function getEdgeProxy(n: RenderedEdge, states: GraphStoresContainer): GraphProxyEdge {
    let p = states.context.get().proxyEdgesMap.get(n);
    if (!p) {
        p = createEdgeProxy(n, states);
        states.context.get().proxyEdgesMap.set(n, p);
    }
    return p;
}

function createEdgeProxy(target: RenderedEdge, $states: GraphStoresContainer): GraphProxyEdge {
    return new Proxy(target as any, {
        get(_, prop) {
            if (allowedGet.has(prop as string))
            {
                if ( prop === "source")
                    return getNodeProxy(target.source, $states);
                if (prop === "target")
                    return getNodeProxy(target.target, $states);
                if (prop === "sourceId")
                    return target.source.id;
                if (prop === "targetId")
                    return target.target.id;
                return (target as any)[prop];
            }
            console.error(`property ${prop as string} cannot be accessed on the GraphProxyEdge.`);
        },
        set(_, prop, value) {
            if (allowedSet.has(prop as string)) {
                (target as any)[prop] = value;
                if (allowedSetWithRedraw.has(prop as string))
                    drawEdge(target, $states);
                return true;
            }
            console.error(`property ${prop as string} cannot be modified on the GraphProxyEdge.`);
            return false;
        }
    }) as GraphProxyEdge;
}