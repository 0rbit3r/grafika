import { XAndY } from "./dataTypes";
import { GraphProxyNode } from "./proxyNode";

export type GraphInteractionEvents = {
    nodeClicked: GraphProxyNode; // event name -> payload type
    nodeDragged: GraphProxyNode;
    viewportMoved: XAndY;
    viewportZoomed: number;
    framePassed: number;
};