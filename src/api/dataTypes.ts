export interface Data {
    nodes?: Node[];
    edges?: Edge[];
}

export interface Node {
    id: number;

    x?: number;
    y?: number;
    radius?: number;
    text?: string;
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

    // Text box renderes a box with text inside of it.
    TextBox = 100
}

export interface Edge {
    sourceId: number;
    targetId: number;

    color?: string;
    type?: EdgeType;

    weight?: number;
    alpha?: number;
    length?: number;
}

export enum EdgeType {
    None = 0,
    Line = 1,
    Arrow = 2,
    Tapered = 3,
    CurvedLine = 4,
    // Animated = 5
    // Animated = 4 animated edges will be pain to optimize...
}

export interface XAndY {
    x: number;
    y: number;
}
