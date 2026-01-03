import { XAndY } from "../api/dataTypes";
import { SIM_WIDTH } from "../core/defaultGraphOptions";
import { RenderedNode } from "../core/renderedNode";

export interface QuadTree {
    position: XAndY;
    size: number;
    centerOfMass?: XAndY;
    mass?: number;


    children?: QuadTree[];
    parent?: QuadTree;

    node?: RenderedNode;
}

export const createQuadTree = (position: XAndY, size: number) => {
    const quadTree: QuadTree = {
        position: { x: -position.x / 2, y: -position.x / 2 },
        size
    }
    return quadTree;
}

export const insertIntoQuadTree = (tree: QuadTree, node: RenderedNode) => {
    const nodeMass = node.radius * node.radius;// give or take... 
    if (!tree.node && !tree.children) {
        tree.node = node;
        tree.centerOfMass = { x: node.x, y: node.y }
        tree.mass = nodeMass
        return;
    }
    if (tree.node && !tree.children) {
        const existingNode = tree.node;
        tree.node = undefined;

        tree.children = [
            createQuadTree(tree.position, tree.size / 2),
            createQuadTree({ x: tree.position.x + tree.size / 2, y: tree.position.y }, tree.size / 2),
            createQuadTree({ x: tree.position.x + tree.size / 2, y: tree.position.y + tree.size / 2 }, tree.size / 2),
            createQuadTree({ x: tree.position.x, y: tree.position.y + tree.size / 2 }, tree.size / 2)
        ];

        switch (hitCheck(tree, existingNode)) {
            case "I":
                insertIntoQuadTree(tree.children[0], existingNode); break;
            case "II":
                insertIntoQuadTree(tree.children[1], existingNode); break;
            case "III":
                insertIntoQuadTree(tree.children[2], existingNode); break;
            case "IV":
                insertIntoQuadTree(tree.children[3], existingNode); break;
        }
    }
    if (tree.children) {
        tree.centerOfMass = { x: (tree.centerOfMass!.x * tree.mass! + node.x * nodeMass)/(tree.mass! + nodeMass), y: tree.centerOfMass!.y};
        switch (hitCheck(tree, node)) {
            case "I":
                insertIntoQuadTree(tree.children[0], node); break;
            case "II":
                insertIntoQuadTree(tree.children[1], node); break;
            case "III":
                insertIntoQuadTree(tree.children[2], node); break;
            case "IV":
                insertIntoQuadTree(tree.children[3], node); break;
        }
    }
}

type hitCheckResult = "I" | "II" | "III" | "IV" | "OUTSIDE";

function hitCheck(tree: QuadTree, node: RenderedNode): hitCheckResult {

    if (node.x > tree.position.x && node.x < tree.position.x + tree.size / 2
        && node.y > tree.position.y && node.y < tree.position.y + tree.size / 2)
        return "I";

    if (node.x > tree.position.x + tree.size / 2 && node.x < tree.position.x + tree.size
        && node.y > tree.position.y && node.y < tree.position.y + tree.size / 2)
        return "II";

    if (node.x > tree.position.x + tree.size / 2 && node.x < tree.position.x + tree.size
        && node.y > tree.position.y + tree.size / 2 && node.y < tree.position.y + tree.size)
        return "III";

    if (node.x > tree.position.x && node.x < tree.position.x + tree.size / 2
        && node.y > tree.position.y + tree.size / 2 && node.y < tree.position.y + tree.size)
        return "IV";

    return "OUTSIDE";
}