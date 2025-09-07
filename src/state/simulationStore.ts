import { map } from "nanostores"
import { SimulationSettings } from "../api/settings";

export interface SimulationStore {
    frame: number;
}

export const createSimulationStore = (settings?: SimulationSettings) =>
    map<SimulationStore>({
        frame: 0
    });