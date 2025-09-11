import { GraphEdge, GraphNode } from "./dataTypes";


export interface SimulationSettings {
    forceMultiplier?: number;
    linkDistance?: number;
}

export interface DebugSettings {
    showFps?: boolean
}

export interface GraphicsSettings {
    antialiasing?: boolean;
    backgroundColor?: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}


export interface GraphSettings {
    data?: GraphData,
    graphics?: GraphicsSettings,
    simulation?: SimulationSettings,
    debug?: DebugSettings
}