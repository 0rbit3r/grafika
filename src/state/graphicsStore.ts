import { map } from "nanostores";
import { addDraggableViewport, Viewport } from "../graphics/viewport";
import { XAndY } from "../core/innerTypes";
import { GraphicsSettings } from "../api/settings";
import { Graphics, Container, Application, DisplayObject } from "pixi.js";
import { GraphCallbacks } from "../api/controlTypes";
import { EdgeType } from "../api/dataTypes";

export interface GraphicsStore {
  viewport: Viewport;
  app: Application;
  nodeContainer: Container<DisplayObject>;
  edgeContainer: Container<DisplayObject>;
  textContainer: Container<DisplayObject>;

  defaultEdgeType: EdgeType;
}

export const createGraphicsStore = (app: Application, hooks: GraphCallbacks, settings?: GraphicsSettings) =>
  {
    const nodeContainer = new Container();
    const edgeContainer = new Container();

    return map<GraphicsStore>({
    app: app,
    nodeContainer: new Container(),
    textContainer: new Container(),
    edgeContainer: new Container(),
    viewport: addDraggableViewport(app, hooks, [nodeContainer, edgeContainer]),
    defaultEdgeType: settings?.defaultEdgeType ?? EdgeType.Line
  });
}