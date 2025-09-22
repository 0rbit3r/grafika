import { EdgeType, DataInit, NodeShape } from "./dataTypes";

export interface GrafikaSettings {
    data?: DataInit,
    graphics?: GraphicsSettings,
    simulation?: SimulationSettings,
    debug?: DebugSettings
}

// SIMULATION
export interface SimulationSettings {
    forceMultiplier?: number;
    defaultEdgeLength?: number;

    initialPositionsRadius?: number;
    pushThreshold?: number;
}

// DEBUG
export interface DebugSettings {
    showFps?: boolean
}

// GRAPHICS
export interface GraphicsSettings {
    antialiasing?: boolean;
    backgroundColor?: string;

    defaultNodeShape?: NodeShape;
    defaultEdgeType?: EdgeType;
    floatingNodes?: boolean;

    overlay?: OverlaySettings;
    initialZoom?: number;

    defaultEdgeColor?: "source" | "target" | string;
}

export interface OverlaySettings {
    url: string;
    // position and resolution are the same for x and y - the overlay is expected square
    position: number;
    // resolution: number;
    scale: number;

    startDisappearingAt: number;
    disappearCompletelyAt: number;
}

// todo - backdrop will be parallaxed behind the nodes (past era/epoch)
// export interface BackdropSettings