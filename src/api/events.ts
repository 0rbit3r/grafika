import { XAndY } from "./dataTypes";
import { ProxyNode } from "./proxyNode";

export type InteractionEvents = {
    nodeClicked: ProxyNode; // event name -> payload type
    nodeDragged: ProxyNode;
    viewportMoved: XAndY;
    viewportZoomed: number;
    framePassed: number;
    backgroundClicked: {x: number, y: number};
    nodeAdded: ProxyNode;
};