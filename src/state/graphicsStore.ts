import { map } from "nanostores";
import { addDraggableViewport, Viewport } from "../graphics/viewport";
import { XAndY } from "../core/types";
import { GraphicsSettings } from "../api/settings";
import { Graphics, Container, Application, DisplayObject } from "pixi.js";

export interface GraphicsStore {
  viewport: Viewport;
  app: Application;
  nodeContainer: Graphics;
  textContainer: Container<DisplayObject>;
}

export const createGraphicsStore = (app: Application, settings?: GraphicsSettings) =>
  map<GraphicsStore>({
    viewport: addDraggableViewport({ x: app.screen.width, y: app.screen.height }),
    app: app,
    nodeContainer: new Graphics(),
    textContainer: new Container()
  })