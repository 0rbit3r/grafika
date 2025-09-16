export interface GraphDataInit {
    nodes?: GraphNodeInit[];
    edges?: GraphEdgeInit[];
}

export interface GraphNodeInit {
    id: number;

    x?: number;
    y?: number;
    radius?: number;
    title?: string;
    color?: string;
    shape?: NodeShape;

    hollowEffect?: boolean;
    glowEffect?: boolean;
    blinkEffect?: boolean;
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

export interface GraphEdgeInit {
    sourceId: number;
    targetId: number;

    color?: string;
    type?: EdgeType;

    weight?: number;
}

export enum EdgeType {
    None = 0,
    Line = 1,
    Arrow = 2,
    Tapered = 3,
    CurvedLine = 4
    // Animated = 4 animated edges will be pain to optimize...
}

export interface XAndY {
    x: number;
    y: number;
}
