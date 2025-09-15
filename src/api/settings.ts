import { EdgeType, GraphDataInit } from "./dataTypes";


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

    defaultEdgeType: EdgeType;
}


export interface GraphSettings {
    data?: GraphDataInit,
    graphics?: GraphicsSettings,
    simulation?: SimulationSettings,
    debug?: DebugSettings
}