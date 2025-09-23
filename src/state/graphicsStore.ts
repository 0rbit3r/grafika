import { map } from "nanostores";
import { addDraggableViewport, Viewport } from "../graphics/viewport";
import { GraphicsSettings, OverlaySettings } from "../api/settings";
import { Container, Application, DisplayObject, ParticleContainer } from "pixi.js";
import { EdgeType, NodeShape } from "../api/dataTypes";
import { Emitter } from "mitt";
import { InteractionEvents } from "../api/events";

export interface GraphicsStore {
  viewport: Viewport;
  app: Application;
  nodeContainer: Container<DisplayObject>;
  edgeContainer: Container<DisplayObject>;
  textContainer: Container<DisplayObject>;
  debugContainer: Container<DisplayObject>;

  defaultNodeShape: NodeShape;
  defaultEdgeType: EdgeType;

  // nodes turning around a point to make the graph a bit more alive
  floatingNodes: boolean;

  overlaySettings?: OverlaySettings;
  unloadOverlayTexture: () => Promise<void>;

  defaultEdgeColor: "source" | "target" | string;
}

export const createGraphicsStore = (app: Application, interactionEvents: Emitter<InteractionEvents>, settings?: GraphicsSettings) => {
  const nodeContainer = new Container();
  const edgeContainer = new Container();//todo - add parametr to allow ParticleContainer for better performance?

  return map<GraphicsStore>({
    app: app,
    nodeContainer: new Container(),
    textContainer: new Container(),
    debugContainer: new Container(),
    edgeContainer: edgeContainer, 
    floatingNodes: settings?.floatingNodes ?? false,
    viewport: addDraggableViewport(app, interactionEvents, settings?.initialZoom),
    defaultEdgeType: settings?.defaultEdgeType ?? EdgeType.Line,
    overlaySettings: settings?.overlay,

    unloadOverlayTexture: () => Promise.resolve(),

    defaultEdgeColor: settings?.defaultEdgeColor ?? "#dddddd",
    defaultNodeShape: settings?.defaultNodeShape ?? NodeShape.Circle,
  });
}