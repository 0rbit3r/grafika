import {Viewport } from "../graphics/viewport/viewport";
import { addDraggableViewport } from "../graphics/viewport/addViewport";
import { BackdropSettings, GraphicsSettings, OverlaySettings } from "../api/settings";
import { Container, Application } from "pixi.js";
import { EdgeType, NodeShape, XAndY } from "../api/dataTypes";
import { Emitter } from "mitt";
import { InteractionEvents } from "../api/events";
import { DEFAULT_EDGE_ALPHA } from "../core/defaultGraphOptions";
import { RenderedNode } from "../core/renderedNode";

export interface GraphicsStore {
  viewport: Viewport;
  viewportFocus: {
    target: "all" | RenderedNode;
    padding?: number;
    // journey state, lazily initialised by handleViewportFocus when the focus
    // object is fresh (progress === undefined). A new focusOn() call replaces
    // the whole object, so the journey restarts from the current pose.
    startPos?: XAndY;
    startW?: number;
    progress?: number;
    phase?: "flight" | "settle";
  } | null;

  app: Application;
  nodeContainer: Container;
  edgeContainer: Container;
  textContainer: Container;
  debugContainer: Container;

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
    viewportFocus: null,

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