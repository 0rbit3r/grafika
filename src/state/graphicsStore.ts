import { map } from "nanostores";
import { addDraggableViewport, Viewport } from "../graphics/viewport";
import { XAndY } from "../api/dataTypes";
import { GraphicsSettings } from "../api/settings";
import { Graphics, Container, Application, DisplayObject } from "pixi.js";
import { EdgeType } from "../api/dataTypes";
import { Emitter } from "mitt";
import { GraphInteractionEvents } from "../api/events";

export interface GraphicsStore {
  viewport: Viewport;
  app: Application;
  nodeContainer: Container<DisplayObject>;
  edgeContainer: Container<DisplayObject>;
  textContainer: Container<DisplayObject>;

  defaultEdgeType: EdgeType;
}

export const createGraphicsStore = (app: Application, interactionEvents: Emitter<GraphInteractionEvents>, settings?: GraphicsSettings) =>
  {
    const nodeContainer = new Container();
    const edgeContainer = new Container();

    return map<GraphicsStore>({
    app: app,
    nodeContainer: new Container(),
    textContainer: new Container(),
    edgeContainer: new Container(),
    viewport: addDraggableViewport(app, interactionEvents, [nodeContainer, edgeContainer]),
    defaultEdgeType: settings?.defaultEdgeType ?? EdgeType.Line
  });
}