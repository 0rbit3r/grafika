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
    backdrop?: BackdropSettings;    
    initialZoom?: number;
    colorfulText?: boolean;

    defaultEdgeColor?: "source" | "target" | string;
    defaultEdgeAlpha?: number;
}

export interface OverlaySettings {
    url: string;
    scale: number;

    startDisappearingAt: number;
    disappearCompletelyAt: number;
}

export interface BackdropSettings {
    url: string;
    scale: number;
    parallax: number;

    startAppearingAt: number; //when zooming in - ie. startAppearing is lower than fullyVisibleAt
    fullyVisibleAt: number;
}
