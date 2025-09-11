import { Application, Container, Rectangle } from "pixi.js";
import { INITIAL_ZOOM, GRAVITY_FREE_RADIUS, MIN_ZOOM, ZOOM_STEP_MULTIPLICATOR_BUTTONS, MAX_ZOOM, ZOOM_STEP_MULTIPLICATOR_WHEEL } from "../core/defaultGraphOptions";
import { XAndY } from "../core/innerTypes";
import { GraphStoresContainer } from "../state/storesContainer";
import { GraphCallbacks } from "../api/controlTypes";


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

    dragContainer: Container;

    constructor(width: number, height: number, dragContainer: Container) {
        this.height = height;
        this.width = width;
        this.zoom = INITIAL_ZOOM;
        this.position = { x: 0, y: 0 };
        this.dragged = false;
        this.lockedOnNode = false;
        this.dragContainer = dragContainer;
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

    //Used for zooming by buttons
    public zoomByButtonDelta(dir: number) {
        // const oldBottomRight: XAndY = { x: this.position.x + this.zoomedViewportSize().x, y: this.position.y + this.zoomedViewportSize().y };

        if (dir < 0 && this.zoom > MIN_ZOOM)
            this.zoom /= ZOOM_STEP_MULTIPLICATOR_BUTTONS;
        if (dir > 0 && this.zoom < MAX_ZOOM)
            this.zoom *= ZOOM_STEP_MULTIPLICATOR_BUTTONS;

        // const newBottomRight: XAndY = { x: this.position.x + this.zoomedViewportSize().x, y: this.position.y + this.zoomedViewportSize().y };

        // this.moveBy({ x: -(oldBottomRight.x - newBottomRight.x) / 2, y: -(oldBottomRight.y - newBottomRight.y) * 2 / 3});
    }

    //used for zoom by mouse wheel
    public zoomByWheelDelta(dir: number) {
        // const oldBottomRight: XAndY = { x: this.position.x + this.zoomedViewportSize().x, y: this.position.y + this.zoomedViewportSize().y };
        if (dir < 0 && this.zoom > MIN_ZOOM)
            this.zoom /= ZOOM_STEP_MULTIPLICATOR_WHEEL;
        if (dir > 0 && this.zoom < MAX_ZOOM)
            this.zoom *= ZOOM_STEP_MULTIPLICATOR_WHEEL;

        // const newBottomRight: XAndY = { x: this.position.x + this.zoomedViewportSize().x, y: this.position.y + this.zoomedViewportSize().y };

        // this.moveBy({ x: -(oldBottomRight.x - newBottomRight.x) / 2, y: -(oldBottomRight.y - newBottomRight.y) * 2 / 3 });
    }

    toViewportCoordinates = (position: XAndY): XAndY => {
        return {
            x: (position.x - this.position.x) * this.zoom + this.width / 2,
            y: (position.y - this.position.y) * this.zoom + this.height / 2
        };
    }

    zoomedViewportSize = (): XAndY => {
        return {
            x: this.width / this.zoom,
            y: this.height / this.zoom
        }
    }

}

export const addDraggableViewport = (viewportSize: XAndY, app: Application, hooks: GraphCallbacks) => {
    const dragContainer = new Container();

    const viewport = new Viewport(viewportSize.x, viewportSize.y, dragContainer);

    // dragContainer.width = app.screen.width;
    // dragContainer.height = app.screen.height; Doesn't affect anything... 
    dragContainer.hitArea = new Rectangle(0, 0, viewportSize.x, viewportSize.y);
    dragContainer.sortableChildren = true;

    dragContainer.eventMode = 'static';
    // dragContainer.zIndex = DRAG_Z;
    dragContainer.cursor = 'grab';
    dragContainer.on('pointerdown', () => {
        if (!app.ticker.started) return;
        viewport.dragged = true;
        // useGraphStore.getState().setLockedOnHighlighted(false);       <---   cancels locked on highlight
    });

    dragContainer.on('pointerup', () => {
        viewport.dragged = false;
    });

    dragContainer.on('pointerupoutside', () => {
        viewport.dragged = false;
    });

    dragContainer.on('pointermove', (event) => {
        if (viewport.dragged && app.ticker.started) {
            viewport.moveByZoomed({ x: event.movementX, y: event.movementY });
            hooks.onViewportMoved && hooks.onViewportMoved(viewport.position.x, viewport.position.y);
        }
        // else  if (event.type === 'touch'){
        //     const touchEvent = event.originalEvent.nativeEvent as PixiTouch;
        //     touchEvent.type
        // }
    });

    dragContainer.on('wheel', event => {
        if (!app.ticker.started) return;
        event.preventDefault();
        event.stopPropagation();
        viewport.zoomByWheelDelta(-event.deltaY);
        hooks.onViewportZoomed && hooks.onViewportZoomed(viewport.zoom);
    });

    return viewport;
}