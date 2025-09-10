import { map } from "nanostores"
import { SimulationSettings } from "../api/settings";
import { DEFAULT_EDGE_LENGTH } from "../core/defaultGraphOptions";

export interface SimulationStore {
    simulationEnabled: boolean;

    frame: number;
    gravityEnabled: boolean;

    edgeLength: number;
    upflowEnabled: boolean;
}

export const createSimulationStore = (settings?: SimulationSettings) =>
    map<SimulationStore>({
        frame: 0,
        simulationEnabled: false,
        gravityEnabled: false,
        edgeLength: DEFAULT_EDGE_LENGTH, //TODO ADD TO SETTINGS?,
        upflowEnabled: false
    });