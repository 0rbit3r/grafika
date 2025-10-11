import { Application, Container, DisplayObject, Rectangle } from "pixi.js";
import { MIN_ZOOM, ZOOM_STEP_MULTIPLICATOR_BUTTONS, MAX_ZOOM, ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../../core/defaultGraphOptions";
import { XAndY } from "../../api/dataTypes";
import { InteractionEvents } from "../../api/events";
import { Emitter } from "mitt";


export class Viewport {
    height: number;
    width: number;
    position: XAndY;
    zoom: number;
    // indicates whether the viewport is being dragged/moved by the user
    dragged: boolean;
    // indicates whether the viewport follows a highlighted node
    lockedOnNode: boolean;
    // onScreenSizeChange: () => void;
    interactionEvents: Emitter<InteractionEvents>;

    dragContainer: Container;

    constructor(width: number, height: number, dragContainer: Container, interactionEvents: Emitter<InteractionEvents>, initialZoom?: number) {
        this.width = width;
        this.height = height;
        this.zoom = initialZoom ?? 1;
        this.position = { x: 0, y: 0 };
        this.dragged = false;
        this.lockedOnNode = false;
        this.dragContainer = dragContainer;
        this.interactionEvents = interactionEvents;
    }

    public resizeHitArea = (width: number, height: number) => {
        this.width = width;
        this.height = height;
        if (!this.dragContainer.destroyed) this.dragContainer.hitArea = new Rectangle(0, 0, width, height);
    }

    // Moves the viewport by zoom-corrected amount
    public moveByZoomed = (delta: XAndY) => {
        this.moveBy({ x: delta.x / this.zoom, y: delta.y / this.zoom });
    }

    // Moves the viewport by global coordinates
    public moveBy = (delta: XAndY) => {
        this.position.x -= delta.x;
        this.position.y -= delta.y;

        // border behavior
        // if (!useGraphControlsStore.getState().strongerPushForce) {

        //     if (this.position.x > GRAVITY_FREE_RADIUS)
        //         this.position.x = GRAVITY_FREE_RADIUS;
        //     if (this.position.y > GRAVITY_FREE_RADIUS)
        //         this.position.y = GRAVITY_FREE_RADIUS;
        //     if (this.position.x < -GRAVITY_FREE_RADIUS)
        //         this.position.x = -GRAVITY_FREE_RADIUS;
        //     if (this.position.y < -GRAVITY_FREE_RADIUS)
        //         this.position.y = -GRAVITY_FREE_RADIUS;
        // }
    }

    toViewportCoordinates = (position: XAndY): XAndY => {
        return {
            x: (position.x - this.position.x) * this.zoom + this.width / 2,
            y: (position.y - this.position.y) * this.zoom + this.height / 2
        };
    }

    toGlobalCoordinates = (ViewportRelativePos: XAndY): XAndY => ({
        x: (ViewportRelativePos.x - this.width / 2) / this.zoom + this.position.x,
        y: (ViewportRelativePos.y - this.height / 2) / this.zoom + this.position.y
    })

    zoomedViewportSize = (): XAndY => {
        return {
            x: this.width / this.zoom,
            y: this.height / this.zoom
        }
    }

    updateZoom = (newZoom: number, globalCoors: XAndY) => {
        newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
        // keep centerWorld stable on screen
        this.position.x = globalCoors.x - (globalCoors.x - this.position.x) * (this.zoom / newZoom);
        this.position.y = globalCoors.y - (globalCoors.y - this.position.y) * (this.zoom / newZoom);
        this.zoom = newZoom;
        this.interactionEvents.emit("viewportZoomed", this.zoom);
        this.interactionEvents.emit("viewportMoved", { x: this.position.x, y: this.position.y });
    }
}
