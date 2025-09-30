import { addDraggableViewport, Viewport } from "../graphics/viewport";
import { BackdropSettings, GraphicsSettings, OverlaySettings } from "../api/settings";
import { Container, Application, DisplayObject, ParticleContainer } from "pixi.js";
import { EdgeType, NodeShape } from "../api/dataTypes";
import { Emitter } from "mitt";
import { InteractionEvents } from "../api/events";
import { DEFAULT_EDGE_ALPHA } from "../core/defaultGraphOptions";

export interface GraphicsStore {
  viewport: Viewport;
  app: Application;
  nodeContainer: Container<DisplayObject>;
  edgeContainer: Container<DisplayObject>;
  textContainer: Container<DisplayObject>;
  debugContainer: Container<DisplayObject>;

  defaultNodeShape: NodeShape;
  defaultEdgeType: EdgeType;
  defaultEdgeAlpha: number;

  // nodes turning around a point to make the graph a bit more alive
  floatingNodes: boolean;

  overlaySettings?: OverlaySettings;
  backdropSettings?: BackdropSettings;

  defaultEdgeColor: "source" | "target" | string;
  colorfulText: boolean;
}

export function createGraphicsStore
  (app: Application, interactionEvents: Emitter<InteractionEvents>, settings?: GraphicsSettings): GraphicsStore {

  return {
    app: app,
    nodeContainer: new Container(),
    textContainer: new Container(),
    debugContainer: new Container(),
    edgeContainer: new Container(),
    floatingNodes: settings?.floatingNodes ?? false,
    viewport: addDraggableViewport(app, interactionEvents, settings?.initialZoom),
    defaultEdgeType: settings?.defaultEdgeType ?? EdgeType.Line,

    overlaySettings: settings?.overlay,

    backdropSettings: settings?.backdrop,

    defaultEdgeColor: settings?.defaultEdgeColor ?? "#dddddd",
    defaultNodeShape: settings?.defaultNodeShape ?? NodeShape.Circle,

    colorfulText: settings?.colorfulText ?? false,

    defaultEdgeAlpha: settings?.defaultEdgeAlpha ?? DEFAULT_EDGE_ALPHA
  };
}