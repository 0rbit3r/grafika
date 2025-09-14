import { RenderedNode } from "../core/renderedNode";
import { GraphNode, NodeShape } from "./dataTypes";
import { GraphStoresContainer } from "../state/storesContainer";
import { drawNode } from "../graphics/drawNode";

const allowedWithRedraw = new Set(["color", "radius", "shape", "title", "hollowEffect", "glowEffect", "blinkEffect"])
const setAllowed = new Set([...allowedWithRedraw, "x", "y",]);
const getAllowed = new Set([...setAllowed, "id"]);

function createNodeProxy(target: RenderedNode, $states: GraphStoresContainer): GraphNode {
    return new Proxy(target as any, {
        get(_, prop) {
            if (getAllowed.has(prop as string))
                return (target as any)[prop];
            console.error(`property ${prop as string} cannot be accessed on the GraphNode.`);
        },
        set(_, prop, value) {
            if (setAllowed.has(prop as string)) {
                (target as any)[prop] = value;
                if (allowedWithRedraw.has(prop as string))
                    drawNode(target, $states);
                return true;
            }
            console.error(`property ${prop as string} cannot be modified on the GraphNode.`);
            return false;
        }
    }) as GraphNode;
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