import { GraphNode } from "./graphNode";


export interface SimulationSettings {
    forceMultiplier?: number;
    linkDistance?: number;
}

export interface DebugSettings {
    showFps?: boolean
}

export interface GraphicsSettings {
    antialiasing: boolean;
}


export interface GraphSettings {
    data?: GraphNode[],
    graphics?: GraphicsSettings,
    simulation?: SimulationSettings,
    debug?: DebugSettings
}