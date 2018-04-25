import {LayerContainer} from "./layer";

export class OperationContainer {
    public toNext: Array<Operation> = [];
    public toPrevious: Array<Operation> = [];
    public socket: any;

	constructor(socket: any) {
        this.socket = socket;
	};
    
    addOperation(socket: any, layer_id: number, brush: string, filter: {id:string, parameters:string, sourcepng:string}, kind: string) {
        var theNewOperation = new Operation(layer_id, brush, filter, this.toPrevious[this.toPrevious.length-1], this.toPrevious[0], kind);
        this.socket.emit("saving_op", theNewOperation);

    };

}

export class Operation {

	public layer_id : number;
	public brush : string;
	public filter : {id: string, parameters: string, sourcepng: string};
	public pointerToPrevious: Operation;
	public pointertoNext: Operation;
    public timestamp: number;
    public hash: number;
    public kind: string;

	constructor(layer_id: number, brush: string, filter: {id:string, parameters:string, sourcepng:string}, pointerToPrevious: Operation, pointertoNext: Operation, kind: string) {
        this.layer_id = layer_id;
        this.brush = brush;
        this.filter = filter;
        this.pointerToPrevious = pointerToPrevious;
        this.pointertoNext = pointertoNext;
        this.timestamp = new Date().getTime();
        this.hash = this.hashCode(String(this.timestamp)+String(Math.floor((Math.random() * 1000000) + 1)));
        this.kind = kind;
	};
	

    hashCode = function(source: string) {
        var hash: number = 0
        var i : number;
        var chr : number;
        var len : number;
        if (source.length === 0) return hash;
        for (i = 0, len = source.length; i < len; i++) {
            chr   = source.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash;
    };

}