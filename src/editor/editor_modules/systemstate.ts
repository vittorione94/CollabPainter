import * as console from 'console';
/// <reference path="../../_all.d.ts" />

import {Layer, LayerContainer} from "./layer";
var socketC = require("socket.io-client");

export class SystemState { 

    public layers: {[layer_id: number] : {inuse: boolean, order: number, filters: Array<{filter_id: string, parameters:Array<String>}>, visible: boolean}} = {};
    private socket : SocketIOClient.Socket;

    constructor(theSocket : SocketIOClient.Socket) {
        this.socket = theSocket;
    }

    public updateStateFilters(layer_id: number, filter_id: string, parameters: Array<string>) {
        this.layers[layer_id].filters.push({filter_id,parameters});
        this.socket.emit("saving_json", this);
    }

    public updateStateLayers(operation:string, layers: Array<Layer> = null, layer_id:number= null, layer_order: Array<Layer>=null) {
        
        switch (operation) {
            case "add":
                this.layers[layer_id] = {inuse: true , order: layer_id, filters: [], visible: true};
                break;
           case "delete":
                //eventually we'll maintain it in layers, setting an "inuse" attribute instead. 
                this.layers[layer_id].inuse = false;
                this.layers[layer_id].order = -1;
                //  devo aggiornare anche l'ordine degli altri
                break;
           case "reorder":
                var thislayers = this.layers;
                layer_order.forEach(function(layer) {
                    if(thislayers[layer.id].inuse) {
                        thislayers[layer.id].order = +layer_order[layer.id].destCVS.style.zIndex/2;
                    }
                });
                break;
            case "visibility": 
                this.layers[layer_id].visible = false;
            default:
                break;
        }
        this.socket.emit("saving_json", this.layers);
     }

    public dumpToJSON() {
        var json = JSON.stringify(this.layers);
    }
}
