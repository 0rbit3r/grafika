import { map } from "nanostores";
import { DebugSettings } from "../api/settings";

export interface DebugStore{
    showFps: boolean;
}

export const createDebugStore = (settings?: DebugSettings) =>
    map<DebugStore>({
        showFps: settings?.showFps ?? false
    });