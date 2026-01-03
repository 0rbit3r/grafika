import { DebugSettings } from "../api/settings";

export interface DebugStore{
    showFps: boolean;
    logToConsole: boolean;
}

export function createDebugStore(settings?: DebugSettings): DebugStore{

    return {
        showFps: settings?.showFps ?? false,
        logToConsole: false,
    };
}