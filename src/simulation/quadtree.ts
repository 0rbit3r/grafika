import { RenderedNode } from "../core/renderedNode";

export interface QuadCell {
    x: number;      // left edge
    y: number;      // top edge
    half: number;   // half of side length; full cell covers [x, x+half*2] × [y, y+half*2]
    node: RenderedNode | null;
    nw: QuadCell | null;
    ne: QuadCell | null;
    sw: QuadCell | null;
    se: QuadCell | null;
}

const MAX_DEPTH = 24;

function makeCell(x: number, y: number, half: number): QuadCell {
    return { x, y, half, node: null, nw: null, ne: null, sw: null, se: null };
}

function insertIntoChild(cell: QuadCell, node: RenderedNode, depth: number): void {
    const cx = cell.x + cell.half;
    const cy = cell.y + cell.half;
    if (node.x < cx) {
        if (node.y < cy) insert(cell.nw!, node, depth + 1);
        else             insert(cell.sw!, node, depth + 1);
    } else {
        if (node.y < cy) insert(cell.ne!, node, depth + 1);
        else             insert(cell.se!, node, depth + 1);
    }
}

function insert(cell: QuadCell, node: RenderedNode, depth: number): void {
    if (cell.nw === null && cell.node === null) {
        cell.node = node;
        return;
    }
    if (depth >= MAX_DEPTH) return; // co-located nodes; skip to prevent infinite recursion
    if (cell.nw === null) {
        const existing = cell.node!;
        cell.node = null;
        const h = cell.half / 2;
        cell.nw = makeCell(cell.x,            cell.y,            h);
        cell.ne = makeCell(cell.x + cell.half, cell.y,            h);
        cell.sw = makeCell(cell.x,            cell.y + cell.half, h);
        cell.se = makeCell(cell.x + cell.half, cell.y + cell.half, h);
        insertIntoChild(cell, existing, depth);
    }
    insertIntoChild(cell, node, depth);
}

export function buildQuadTree(nodes: RenderedNode[]): QuadCell | null {
    if (nodes.length === 0) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
    }

    const span = Math.max(maxX - minX, maxY - minY, 1);
    const half = span / 2 + 1; // +1 so boundary nodes fall strictly inside
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const root = makeCell(cx - half, cy - half, half);
    for (const n of nodes) insert(root, n, 0);
    return root;
}

// Minimum distance from point (px, py) to any point on/inside the cell's bounding box.
export function cellMinDist(cell: QuadCell, px: number, py: number): number {
    const clampedX = Math.max(cell.x, Math.min(px, cell.x + cell.half * 2));
    const clampedY = Math.max(cell.y, Math.min(py, cell.y + cell.half * 2));
    const dx = px - clampedX;
    const dy = py - clampedY;
    return Math.sqrt(dx * dx + dy * dy);
}
