/// <reference path="../_all.d.ts" />

import { runInThisContext } from 'vm';
import {SyncEvent} from "ts-events";

import {Layer, LayerContainer} from "./editor_modules/layer";
import {Button, Interface, EventHandler} from "./editor_modules/ui";

import {Selector, Brush, TexBrush, Eraser, Smudge} from "./editor_modules/tools";
import {OperationContainer} from "./editor_modules/operations.ts";
import {SystemState} from "./editor_modules/systemstate";

import {Dag} from "../dag.ts"

//FILTERS IMPORT
import {FilterManager} from "./editor_modules/filters/FilterManager";

var socketC = require("socket.io-client");

function hexToRgb(hex : string) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

function getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export class Editor {

	private alphaCVS  : HTMLCanvasElement;
	private alphaCTX : CanvasRenderingContext2D;

	private isDrawing : boolean = false;

	private x : number = 0;
	private y : number = 0;
	private lastX : number;
	private lastY : number;

	private brsh : Brush;
	private txbrsh : TexBrush;
	private eraser: Eraser;
	private currentTool : any;
	private remoteLayer : number = null;
	public rgb_canvas: HTMLCanvasElement;
	public rgb_context: CanvasRenderingContext2D;
	public op_cache: Array<any>;

	public operationContainer: OperationContainer;

	private selectedLayer : Layer;

	private collabCVS  : HTMLCanvasElement;
	private collabCTX : CanvasRenderingContext2D;
	private filterManager : FilterManager;

	public layers : LayerContainer ;
	private width : number = 800;
	private height: number = 600;
	private selection_active: Selector;

	public systemstate: SystemState;
	private smudge_active : Smudge;

	private socket : SocketIOClient.Socket ;

	private usercolor : string = getRandomColor();
	private dag : Dag;
	private eraserShot : string = "";

	constructor( base_canvas : string) {

		this.rgb_canvas = document.createElement("canvas");
		this.rgb_canvas.setAttribute("width", String(this.width));
		this.rgb_canvas.setAttribute("height", String(this.height));
		this.rgb_context = this.rgb_canvas.getContext("2d");

		this.op_cache = [];
		
		this.alphaCVS = document.createElement("canvas");
		this.alphaCVS.setAttribute("style", "z-index:1000");
		this.alphaCVS.setAttribute("width", String(this.width));
		this.alphaCVS.setAttribute("height", String(this.height));

		document.body.appendChild(this.alphaCVS);
		this.alphaCTX = this.alphaCVS.getContext("2d");

		// Listner to the mouse drawing moves
	 	this.alphaCVS.addEventListener("mousedown", this.onCanvasMouseDown, false);
	 	this.alphaCVS.addEventListener("mousemove", this.onCanvasMove, false);
	 	this.alphaCVS.addEventListener("mouseup", this.onCanvasUp, false);
		this.alphaCVS.addEventListener("mouseleave", this.onCanvasUp, false);

		// this.alphaCVS.addEventListener("mousemove", this.drawMouse, false);

		this.collabCVS = document.createElement("canvas");
		this.collabCVS.setAttribute("style", "z-index:1001;pointer-events:none;");
		this.collabCVS.setAttribute("width", String(this.width));
		this.collabCVS.setAttribute("height", String(this.height));

		document.body.appendChild(this.collabCVS);
		this.collabCTX = this.collabCVS.getContext("2d");

		this.brsh = new Brush();
		this.txbrsh = new TexBrush("brush_v1.png");
		this.eraser = new Eraser();
		this.currentTool = this.brsh;

		//strumento di selezione attivo
		this.selection_active = null;
		this.smudge_active = null; 

		//  vedere se tenere questo qui non è network fault tollerant
		this.socket = io.connect(window.location.origin);
		this.socket.on("saved_op", this.applyOp );
		this.socket.on("saved_json", this.applyJson );
		this.socket.on("layerselected", this.changeCoLayer);
		this.socket.on("layercreated", this.createCoLayer);
		this.socket.on("movingMouse", this.drawMouse);
		this.socket.on("initialSync", this.initialSync);
		this.socket.emit("connected",{data : this.socket.id});
		
		this.systemstate = new SystemState(this.socket);
		this.operationContainer = new OperationContainer(this.socket);
		
		this.layers = new LayerContainer(this.width, this.height, this.systemstate);
		this.filterManager = new FilterManager(this.systemstate);   

		//the default zero Layer
		this.selectedLayer = this.layers.addLayer();
	}

	private drawCursor () {

	}

	private drawMouse = (data : any) => {
		console.log(data);
		//2d0 [INTERACTION MODE]
		this.collabCTX.clearRect(0, 0, this.width, this.height);
		this.collabCTX.beginPath();
		this.collabCTX.arc(data.data.x, data.data.y, Number(data.ray), 0, 2 * Math.PI);
		this.collabCTX.fillStyle = data.user_color;
		this.collabCTX.fill();
		this.collabCTX.stroke();
	}

	private changeCoLayer = (data : any) => {
		var layer_id = data.data.layer_id;
		this.layers.getLayer(layer_id).selectedByRemote(data.data.user_color);
		var old_layer_id = data.data.old_layer_id;
		this.layers.getLayer(old_layer_id).unselectedByRemote();
	}

	private createCoLayer = (data : any) => {
		var fatherlayer_id = data.data.fatherlayer_id;
		this.remoteLayer = fatherlayer_id;
		addLayer_button.clickButton();
	}

	private initialSync = (data : any) => {	
		//var json_sys = data.data.json_sys;
		console.log("NUOVO CLIENT SYNCATO");
		console.log(data.json_sys);
		//var json_sys = data.data.json_sys;
	}

	private applyJson = (data : any) => {
		// this.systemstate.updateSys (data);
		//var json = data.data;
		//json interpretation goes here
	}

	private drawOp = (data : any) => {
		var img = new Image();
		var editor = this;
		var isEraser = data.kind === "eraser";
		var layer = editor.layers.getLayer(data.layer_id);
		img.onload = function() {
			layer.destCTX.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
			layer.destCTX.drawImage(img, 0, 0, editor.width, editor.height);
			layer.destCTX.globalCompositeOperation = "source-over";
			layer.update_preview();
		}
		img.src = data.brush;
	}

	private applyOp = (data : any) => {
		if(this.isDrawing) {
			this.op_cache.push(data.data);
		} else {
			this.drawOp(data.data);
		}
	}

	private clearCache = () => {
		var editor = this;
		this.op_cache.forEach(function(operation) {
			editor.drawOp(operation);
		});
		this.op_cache = [];
	}


	private getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
        var rect = canvas.getBoundingClientRect();
    	return {
			x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
			y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
		};
    }

	private onCanvasMouseDown = (e: MouseEvent) => {
		/* Pointer events disattivati per tutti i layer sopra quello selezionato */
		this.layers.manageLayerEvents(this.selectedLayer.id);
		this.alphaCVS.style.zIndex = String(+(this.selectedLayer.destCVS.style.zIndex)+2);

		var point = this.getMousePos(this.selectedLayer.destCVS, e);
		this.socket.emit("moveMouse",{data:point}) ;
		this.isDrawing = true;
		this.lastX = point.x;
		this.lastY = point.y;
		if (this.currentTool instanceof Eraser) {
			this.selectedLayer.destCTX.globalCompositeOperation = "destination-out";
			this.eraserShot = this.selectedLayer.destCVS.toDataURL();
		} 
		else {
			this.selectedLayer.destCTX.globalCompositeOperation = "source-over";
		}

		if(this.currentTool instanceof Smudge){
			if(this.lastX == undefined || this.lastX == Infinity || this.lastY == undefined || this.lastY == Infinity){console.log("aiuttttttoooooooo!!!");}
			this.currentTool.grabSmudgeData(this.selectedLayer.destCTX,this.selectedLayer.destCVS, this.lastX,this.lastY);
		}
		else{
			this.currentTool.draw(this.alphaCTX, this.selectedLayer.destCTX, this.rgb_canvas, this.lastX, this.lastY, this.alphaCTX.lineWidth);
		}

	}

	private onCanvasMove = (e: MouseEvent) => {
  		if (this.isDrawing) {
			var point = this.getMousePos(this.selectedLayer.destCVS, e);
			// this.socket.emit("moveMouse",{data:point,ray:this.alphaCTX.lineWidth,user_color: this.usercolor}) ;
			this.x = point.x;
			this.y = point.y;

			// the distance the mouse has moved since last mousemove event
			var dis = Math.sqrt(Math.pow(this.lastX - this.x, 2) + Math.pow(this.lastY - this.y, 2));

			// for each pixel distance, draw a circle on the line connecting the two points
			// to get a continous line.

			if(this.currentTool instanceof Smudge){
				this.currentTool.applyToolAlongLine(this.selectedLayer.destCTX,this.lastX, this.lastY, this.x, this.y);
			}
			else{
				for (var i = 0; i < dis; i++) {
					var s = i / dis;
					this.currentTool.draw(this.alphaCTX, this.selectedLayer.destCTX, this.rgb_canvas, this.lastX * s + this.x * (1 - s), this.lastY * s + this.y * (1 - s), this.alphaCTX.lineWidth);

				}
			}

			this.lastX = this.x;
			this.lastY = this.y;
		}
    }

	private onCanvasUp = (e: MouseEvent) => {
		if (this.isDrawing){
			this.alphaCVS.style.zIndex = "1000";
			this.isDrawing = false;
			// layer-draw
			this.selectedLayer.destCTX.globalCompositeOperation = "source-over";
			var selectedLayer = this.selectedLayer;
			var eraserShot = this.eraserShot;
			if (this.currentTool instanceof Eraser) {
				var img = new Image();
				img.onload = function() {
					selectedLayer.destCTX.clearRect(0,0,selectedLayer.destCVS.width,selectedLayer.destCVS.height);
					selectedLayer.destCTX.drawImage(img,0,0);
				}
				img.src = eraserShot;
				this.operationContainer.addOperation(this.socket, this.selectedLayer.id, this.rgb_canvas.toDataURL(),null,"eraser");
			} else {
				this.operationContainer.addOperation(this.socket, this.selectedLayer.id, this.alphaCVS.toDataURL(),null,"brush");
			}
			//this.virtualCTX.drawImage(this.alphaCVS, 0, 0);
			this.alphaCTX.clearRect(0, 0, this.alphaCVS.width, this.alphaCVS.height);
			this.rgb_context.clearRect(0, 0, this.rgb_canvas.width, this.rgb_canvas.height);
			this.clearCache();
		}
	}

	private saveImage = () => {
		var images : Array<HTMLCanvasElement> = [];
		this.layers.allLayers.forEach(function(layer){
			images[+layer.destCVS.style.zIndex/3] = layer.destCVS;
		});
		var cvs = document.createElement("canvas");
		cvs.width = this.width;
		cvs.height = this.height;
		var ctx = cvs.getContext("2d");
		ctx.globalCompositeOperation = "source-over";
		images.forEach(function(canvas){
			ctx.drawImage(canvas,0,0);
		});
		return cvs.toDataURL();
	};

	public clickElem(myButton : Button ) {

		//se sono uscito dalla modalità selezione
		if (this.selection_active != null) {
			this.alphaCVS.addEventListener("mousedown", this.onCanvasMouseDown, false);
			this.alphaCVS.addEventListener("mousemove", this.onCanvasMove, false);
			this.alphaCVS.addEventListener("mouseup", this.onCanvasUp, false);
			this.alphaCVS.addEventListener("mouseleave", this.onCanvasUp, false);
			this.selection_active.shut_events();
			//togli ultimo rettangolo se presente
			var old_rect = document.getElementById("rectangle_old");
			if (old_rect !== null) {
				old_rect.remove();
			}
			var new_rect = document.getElementById("rectangle_new");
			if (new_rect !== null) {
				new_rect.remove();
			}
			this.selection_active = null;
		}
		switch (myButton.button_name) {
			case "selection":
				this.alphaCVS.removeEventListener("mousedown", this.onCanvasMouseDown, false);
				this.alphaCVS.removeEventListener("mousemove", this.onCanvasMove, false);
				this.alphaCVS.removeEventListener("mouseup", this.onCanvasUp, false);
				this.alphaCVS.removeEventListener("mouseleave", this.onCanvasUp, false);
				var selector = new Selector(this.alphaCVS, this.selectedLayer);
				this.selection_active = selector;
				break;
			case "addLayer":
				if (this.remoteLayer === null) {
					var oldselected = this.selectedLayer.id;
					var newLayer = this.layers.addLayer(this.selectedLayer);
					this.selectedLayer = newLayer;
					this.selectedLayer.makeSelected();
					this.socket.emit("createlayer", { fatherlayer_id: this.selectedLayer.id});
					this.socket.emit("selectlayer", { layer_id: this.selectedLayer.id, user_color: this.usercolor, old_layer_id: oldselected});
				} else {
					var fatherLayer = this.layers.getLayer(this.remoteLayer);
					this.layers.addLayer(fatherLayer);
				}
				this.remoteLayer = null;
				break;
			case "delLayer":
				if (document.getElementsByClassName("layer").length > 1) {
					this.layers.delLayer(this.selectedLayer);
					if (this.selectedLayer.fatherLayer && this.selectedLayer.fatherLayer.inuse) {
						this.selectedLayer = this.selectedLayer.fatherLayer;
					} else {
						var found: boolean = false;
						for (var i: number = 0; i < this.layers.length && !found; i++) {
							if (this.layers.allLayers[i].inuse) {
								this.selectedLayer = this.layers.allLayers[i];
								found = true;
							}
						}
					}
					this.selectedLayer.makeSelected();
				}
				break;
			case "layer":
				var oldselected = this.selectedLayer.id;
				this.selectedLayer.unselect();
				this.layers.makeSelected(Number(myButton.button_prop.getAttribute("id").split("-")[1]));
				this.selectedLayer = this.layers.getLayer(Number(myButton.button_prop.getAttribute("id").split("-")[1]));				
				this.socket.emit("selectlayer", { layer_id: this.selectedLayer.id, user_color: this.usercolor, old_layer_id: oldselected});

				break;
			case "smudge":
				console.log("smudge pressed");
				var smudge = new Smudge(this.width,this.height);
				this.currentTool = smudge;
			break;
			case "brush":
				this.alphaCTX.lineWidth = Number(width_button.button_prop.value);
				this.currentTool = this.brsh;
				break;
			case "texbrush":
				this.currentTool = this.txbrsh;
				break;
			case "eraser":
				this.alphaCTX.lineWidth = Number(eraser_width_button.button_prop.value);
				this.currentTool = this.eraser;
				break;
			case "save":
				var a : HTMLAnchorElement = document.createElement('a');
				a.href = this.saveImage();
				a.setAttribute("download","image.png");
				a.click();
				break;
			case "load":

			    var new_input = document.createElement('input');
			    new_input.type="file";
				var editor = this;
				new_input.onchange = function(event: any) {
					var reader = new FileReader();
					reader.addEventListener("load", function () {
						var img = new Image();
						img.src = reader.result;
						img.onload = function () {
							editor.operationContainer.addOperation(editor.socket, editor.selectedLayer.id, img.src, null,"load");
						}	  		
				}, false);
      				reader.readAsDataURL(event.target.files[0]);	
				};
				new_input.click();

				break;
			case "init":
				for (var i : number =0; this.layers.allLayers.length; i++ ){
					this.layers.allLayers[i].clear();
				}
				break;
			case "tex_brush_img1":
				this.txbrsh.setImg("brush_v1.png");
			break;
			case "tex_brush_img2":
				this.txbrsh.setImg("brush_v2.png");
			break;
			case "tex_brush_img3":
				this.txbrsh.setImg("brush_v3.png");
			break;
			case "eraser_square":
				this.eraser.shape = "square";
			break;

			case "eraser_circle":
				this.eraser.shape = "circle";

			break;
			case "blur":
			case "gaussian":
			case "gaussianBlur":
			case "gamma":
			case "pixelate":
			case "grayscale":
			case "sepiaTone":
			case "sharpen":	
			case "median":
			case "gauss-gauss":
				var canvas = this.selectedLayer.destCVS;
				var ctx = this.selectedLayer.destCTX;
				var imageData = ctx.getImageData(0,0,canvas.width, canvas.height);
				this.filterManager.applyFilter(myButton.button_name, imageData, this.selectedLayer);

			default :
				console.log(myButton.button_name);
				console.log(myButton.button_prop.value);
				console.log("NOT EXPECTED CLICKED Brush ");
			break;
		}
	};


	public updateBrush(myButton : Button ) {
		switch (myButton.button_name) {
			case "width" :
			case "eraser-width" :
				this.alphaCTX.lineWidth = Number(myButton.button_prop.value);
				break;
			case "color" :
				var res = hexToRgb(myButton.button_prop.value);
				this.brsh.r = res.r;
				this.brsh.g = res.g;
				this.brsh.b = res.b;
				this.txbrsh.r = res.r;
				this.txbrsh.g = res.g;
				this.txbrsh.b = res.b;
				if(this.txbrsh.r && this.txbrsh.g && this.txbrsh.b) {
					this.txbrsh.changeColor();
				}
				break;
			case "opacity" :
				this.brsh.a = Number(myButton.button_prop.value) / 100;
				this.alphaCTX.globalAlpha =  Number(myButton.button_prop.value) / 100;
				break;
			case "addLayer":
			case "texbrush":
			case "tex_brush_img1":
			case "tex_brush_img2":
			case "tex_brush_img3":
			case "undo":
			case "redo":
			case "save":
			case "load":
			case "delLayer":
			case "selection":
			case "brush":
			case "eraser":
			case "apply_filter":
			case "gaussian":			
			case "blur":
			case "gaussianBlur":
			case "gamma":
			case "pixelate":
			case "grayscale":
			case "sepiaTone":
			case "sharpen":	
			case "median":
			case "gauss-gauss":
			case "smudge":

				break;
			case "layer":
				this.selectedLayer.makeSelected();
				break;
			default :
				console.log(myButton.button_name);
				console.log(myButton.button_prop.value);
				console.log("NOT EXPECTED UPDATED Button ");
				break;
		}
	}
}


// TODO togliere my-canvas
var theEditor = new Editor("my-canvas");
var theInterface = new Interface();

var width_button = new Button(<HTMLInputElement>document.getElementById("brush-width"), "width", document.getElementById("brush-width-label"));
var color_button = new Button(<HTMLInputElement>document.getElementById("brush-color"), "color", document.getElementById("brush-color-label"));
var opacity_button = new Button(<HTMLInputElement>document.getElementById("brush-opacity"), "opacity", document.getElementById("brush-opacity-label"));
var addLayer_button = new Button(<HTMLInputElement>document.getElementById("add-layer"), "addLayer");
var delLayer_button = new Button(<HTMLInputElement>document.getElementById("del-layer"), "delLayer");
var brush_button = new Button(<HTMLInputElement>document.getElementById("brush"), "brush");
var eraser_button = new Button(<HTMLInputElement>document.getElementById("eraser"), "eraser");
var tex_brush_button = new Button(<HTMLInputElement>document.getElementById("texbrush"), "texbrush");
var smudge = new Button(<HTMLInputElement>document.getElementById("smudge"), "smudge");

var eraser_width_button = new Button(<HTMLInputElement>document.getElementById("eraser-width"), "eraser-width", document.getElementById("eraser-width-label"));
var eraser_square = new Button(<HTMLInputElement>document.getElementById("eraser_square"), "eraser_square", document.getElementById("eraser_square-label"));
var eraser_circle = new Button(<HTMLInputElement>document.getElementById("eraser_circle"), "eraser_circle", document.getElementById("eraser_circle-label"));
var tex_brush_img1 = new Button(<HTMLInputElement>document.getElementById("tex_brush_img1"), "tex_brush_img1", document.getElementById("tex_brush_img1-label"));
var tex_brush_img2 = new Button(<HTMLInputElement>document.getElementById("tex_brush_img2"), "tex_brush_img2", document.getElementById("tex_brush_img2-label"));
var tex_brush_img3 = new Button(<HTMLInputElement>document.getElementById("tex_brush_img3"), "tex_brush_img3", document.getElementById("tex_brush_img3-label"));

var selection_button = new Button(<HTMLInputElement>document.getElementById("selection"), "selection");
var undo_button = new Button(<HTMLInputElement>document.getElementById("undo"), "undo");
var redo_button = new Button(<HTMLInputElement>document.getElementById("redo"), "redo");
var save_button = new Button(<HTMLInputElement>document.getElementById("save"), "save");
var load_button = new Button(<HTMLInputElement>document.getElementById("load"), "load");
var init_button = new Button(<HTMLInputElement>document.getElementById("init"), "init");

var gaussian_button = new Button(<HTMLInputElement>document.getElementById("gauss-gauss"), "gauss-gauss");

var blur_button = new Button(<HTMLInputElement>document.getElementById("blur"), "blur");
var gaussian_blur_button = new Button(<HTMLInputElement>document.getElementById("gaussianBlur"), "gaussianBlur");
//var gamma_correction_button = new Button(<HTMLInputElement>document.getElementById("gamma"), "gamma");
var pixelate_button = new Button(<HTMLInputElement>document.getElementById("pixelate"), "pixelate");
var grayscale_button = new Button(<HTMLInputElement>document.getElementById("grayscale"), "grayscale");
var sepia_tone_button = new Button(<HTMLInputElement>document.getElementById("sepiaTone"), "sepiaTone");
//var median_button = new Button(<HTMLInputElement>document.getElementById("median"), "median");
var sharpen_button = new Button(<HTMLInputElement>document.getElementById("sharpen"), "sharpen");

// passive buttons

// TOOLS
theInterface.addButton(brush_button);
theInterface.addButton(eraser_button);
theInterface.addButton(tex_brush_button);
theInterface.addButton(smudge);

theInterface.addButton(eraser_width_button);
theInterface.addButton(selection_button);

// tools PROP 
theInterface.addButton(width_button);
theInterface.addButton(color_button);
theInterface.addButton(opacity_button);
theInterface.addButton(tex_brush_img1);
theInterface.addButton(tex_brush_img2);
theInterface.addButton(tex_brush_img3);
theInterface.addButton(eraser_square);
theInterface.addButton(eraser_circle);

// EDITOR OPS
theInterface.addButton(undo_button);
theInterface.addButton(redo_button);
theInterface.addButton(save_button);

theInterface.addButton(blur_button);

// FILTERS
theInterface.addButton(gaussian_blur_button);
theInterface.addButton(gaussian_button);
theInterface.addButton(pixelate_button);
theInterface.addButton(grayscale_button);
theInterface.addButton(sepia_tone_button);
//theInterface.addButton(median_button);
theInterface.addButton(sharpen_button);



var eventHandler = new EventHandler(theInterface, theEditor);

// active button
theInterface.addButton(addLayer_button);
theInterface.addButton(delLayer_button);
theInterface.addButton(load_button);

eventHandler.updateButtons();

// sync the editor with the actual state of the Interface
theInterface.initButtons();
//var theSceneGraph = new SceneGraph(theEditor);

