import { map } from "nanostores";
import { addDraggableViewport, Viewport } from "../graphics/viewport";
import { GraphicsSettings } from "../api/settings";
import { Container, Application, DisplayObject, ParticleContainer } from "pixi.js";
import { EdgeType } from "../api/dataTypes";
import { Emitter } from "mitt";
import { GraphInteractionEvents } from "../api/events";

export interface GraphicsStore {
  viewport: Viewport;
  app: Application;
  nodeContainer: Container<DisplayObject>;
  edgeContainer: ParticleContainer;
  textContainer: Container<DisplayObject>;
  debugContainer: Container<DisplayObject>;

  defaultEdgeType: EdgeType;
}

export const createGraphicsStore = (app: Application, interactionEvents: Emitter<GraphInteractionEvents>, settings?: GraphicsSettings) => {
  const nodeContainer = new Container();
  const edgeContainer = new Container();

  return map<GraphicsStore>({
    app: app,
    nodeContainer: new Container(),
    textContainer: new Container(),
    debugContainer: new Container(),
    edgeContainer: new ParticleContainer(50000, {
      alpha: true,
      position: true,
      rotation: true,
      scale: true,
      tint: true,
      uvs: false,
      vertices: false
    }), //todo - parametrize
    viewport: addDraggableViewport(app, interactionEvents, [nodeContainer, edgeContainer]),
    defaultEdgeType: settings?.defaultEdgeType ?? EdgeType.Line
  });
}