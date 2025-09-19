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

    defaultEdgeType?: EdgeType;
    floatingNodes?: boolean;

    overlay?: OverlaySettings;
}

export interface GraphSettings {
    data?: GraphDataInit,
    graphics?: GraphicsSettings,
    simulation?: SimulationSettings,
    debug?: DebugSettings
}


export interface OverlaySettings {
    url: string;
    // position and resolution are the same for x and y - the overlay is expected square
    position: number;
    // resolution: number;
    scale: number;

    starDisappearingAt: number;
    disappearCompletelyAt: number;
}

// todo - backdrop will be parallaxed behind the nodes (past era/epoch)
// export interface BackdropSettings