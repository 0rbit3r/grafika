import { map } from "nanostores"
import { SimulationSettings } from "../api/settings";
import { DEFAULT_EDGE_LENGTH, INITIAL_POSITIONS_RADIUS, PUSH_THRESH } from "../core/defaultGraphOptions";

export interface SimulationStore {
    simulationEnabled: boolean;

    frame: number;
    gravityEnabled: boolean;

    defaultEdgeLength: number;
    upflowEnabled: boolean;

    initialPositionsRadius: number;
    pushThreshold: number;
}

export const createSimulationStore = (settings?: SimulationSettings) =>
    map<SimulationStore>({
        frame: 0,
        simulationEnabled: false,
        gravityEnabled: false,
        defaultEdgeLength: settings?.defaultEdgeLength ?? DEFAULT_EDGE_LENGTH, //TODO ADD TO SETTINGS?,
        upflowEnabled: false,
        initialPositionsRadius: settings?.initialPositionsRadius ?? INITIAL_POSITIONS_RADIUS,
        pushThreshold: settings?.pushThreshold ?? PUSH_THRESH
    });