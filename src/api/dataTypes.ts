export interface GraphNode {
    id: number;

    x?: number;
    y?: number;
    radius?: number;
    title?: string;
    color?: string;
    shape?: NodeShape;
    effects?: NodeEffect[];
}

export enum NodeShape {
    Circle = 0,
    Square = 1,
    UpTriangle = 2,
    DownTriangle = 3,
    Diamond = 4,
    Cross = 5,
    Heart = 6,
    // todo: exclamation mark, question mark, dash, checked and unchecked "checkbox-like",  
}

export enum NodeEffect {
    Hollow = 0,
    Aura = 1,
    Blinking = 2
}

export interface GraphEdge {
    sourceId: number;
    targetId: number;

    color?: string;
    type?: EdgeType;

    weight?: number;
}

export enum EdgeType{
    None = 0,
    Line = 1,
    Arrow = 2,
    Tapered = 3,
    // Animated = 4 animated edges will be pain to optimize...
}