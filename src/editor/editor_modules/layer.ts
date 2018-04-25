import {SystemState} from "./systemstate";

export class LayerContainer {
	public allLayers : Array <Layer>;
	private width : number;
	private height : number;
	public length : number;
	public systemstate : SystemState;

	constructor( width : number = null, heigth : number = null, systemstate: SystemState) {
		this.width = width;
		this.height = heigth;
		this.allLayers = [];
		this.length = this.allLayers.length;
		this.systemstate = systemstate;
		document.getElementById("layer-label").addEventListener("click", this.manageOrder);
	};

	addLayer( father : Layer = null, theNewLayer : Layer = null) {
		if (!theNewLayer) {
			var theNewLayer  : Layer = new Layer(this.width, this.height, this.allLayers.length, father );
		}
		this.allLayers.push(theNewLayer);
		this.length = this.allLayers.length;
		if (father) {
			theNewLayer.fatherLayer = father;
			father.unselect();
		}
		this.systemstate.updateStateLayers("add", this.allLayers, theNewLayer.id);
		return theNewLayer;
	};

	delLayer(theLayer : Layer) {
		var layer_inuse : Array<Layer> = [];
		this.allLayers.forEach(function(layer){if (layer.inuse) {layer_inuse.push(layer); }});
		for (var i: number = 0; i < layer_inuse.length; i++) {
			if (layer_inuse[i] === theLayer && layer_inuse[i + 1] && layer_inuse[i - 1]) {
				layer_inuse[i + 1].fatherLayer = layer_inuse[i - 1];
			}
		}
		theLayer.del();
		this.systemstate.updateStateLayers("delete", this.allLayers, theLayer.id);
	};

	makeSelected(id : number) {
		this.allLayers[id].makeSelected();
	};

	manageLayerEvents(selectedLayer: number) {
		var selectedLayer_zindex = +this.allLayers[selectedLayer].destCVS.style.zIndex;
		for(var i:number = 0; i<this.length; i++) {
			var zindex_temp = +this.allLayers[i].destCVS.style.zIndex;
			//se il layer sta sopra quello selezionato, disattivagli i pointer events
			if(zindex_temp>selectedLayer_zindex) {
				this.allLayers[i].destCVS.style.pointerEvents = "none";
			} else {
				this.allLayers[i].destCVS.style.pointerEvents = "";
			}
		}
	}

	getLayer(id : number) {
		return this.allLayers[id];
	};

// 2do togliere questo da qui e metterlo nel layer
	public manageOrder = (event: MouseEvent) => {
		event.preventDefault();
		var elems = document.getElementsByClassName("layer");
		var order: Array<number> = [];
		for (var i = 0; i < elems.length; i++) {
			var index = +(elems[i].id.split("-")[1]);
			order.push(index);
			var visibility = this.allLayers[index].visible ? "block" : "none";
			document.getElementById(String(index + 1)).setAttribute("style", "display:" + visibility + ";z-index:" + (i * 2));
		}
		this.systemstate.updateStateLayers("reorder", null,null,this.allLayers);
	};

}

export class Layer {
	public id : number;
	public destCVS : HTMLCanvasElement;
	public destCTX : CanvasRenderingContext2D;
	public prevCVS: HTMLCanvasElement;
	public prevCTX: CanvasRenderingContext2D;
	public layer_visibility: HTMLElement;
	public fatherLayer : Layer;
	public visible: Boolean;
	public inuse: boolean;
	public htmlIn : HTMLLIElement;
	private width : number;
	private heigth : number;

	//2do get father canvas z-index for setting the depth of the layer
	constructor(width : number = null, heigth : number = null, id : number, father : Layer = null) {

		this.id = id;
		this.visible = true;
		this.inuse = true;
		this.width = width;
		this.heigth = heigth;
		this.destCVS = document.createElement("canvas");
		this.destCVS.setAttribute("id", String(this.id + 1));
		this.destCVS.setAttribute("class", "cvs");
		this.destCVS.setAttribute("style", "z-index:" + (this.id * 2));
		this.destCVS.setAttribute("width", String(width));
		this.destCVS.setAttribute("height", String(heigth));


		document.body.appendChild(this.destCVS);

		this.destCTX = this.destCVS.getContext("2d");
		this.destCTX.globalAlpha = 1.0;
		this.fatherLayer = father;

		var fatherElem = document.getElementById("layers");
		var newHtml = document.createElement("li");
		newHtml.setAttribute("id", "layer-" + this.id);
		newHtml.setAttribute("class", "layer");
		//newHtml.setAttribute("draggable", "true");

		newHtml.innerHTML = "Layer - " + this.id;
		fatherElem.appendChild(newHtml);
		this.htmlIn = newHtml;
		
		
		this.layer_visibility = document.createElement("INPUT");
		this.layer_visibility.setAttribute("type", "button");
		this.layer_visibility.setAttribute("class", "butvis");
		this.layer_visibility.setAttribute("id", "butvis" + (this.id + 1));
		this.layer_visibility.setAttribute("name", String(this.id + 1));

		this.prevCVS = document.createElement("canvas");
		this.prevCVS.setAttribute("class", "preview");
		this.prevCVS.setAttribute("width", "32");
		this.prevCVS.setAttribute("height", "32");
		this.prevCVS.style.pointerEvents = "none";
		this.prevCTX = this.prevCVS.getContext("2d");
		this.prevCTX.globalCompositeOperation = "source-over";

		this.layer_visibility.addEventListener("click", this.change_visibility);

		newHtml.appendChild(this.layer_visibility);
		newHtml.appendChild(this.prevCVS);
	};
	

	public change_visibility = (e : MouseEvent = null) => {
		e.stopPropagation();
		if (this.destCVS.style.display && this.destCVS.style.display === "none") {
			this.destCVS.style.display = "block";
			this.visible = true;
			this.layer_visibility.style.backgroundImage = "url(../../../static/img/eyeo.png)";
		} else {
			this.destCVS.style.display = "none";
			this.visible = false;
			this.layer_visibility.style.backgroundImage = "url(../../../static/img/eyec.png)";
		}
	}

	public del() {
		var HTMLLabel = document.getElementById("layer-" + this.id);
		HTMLLabel.parentElement.removeChild(HTMLLabel);
		this.destCVS.parentElement.removeChild(this.destCVS);
		this.inuse = false;
	}

	public setId(id : number) {
		var HTMLLabel : HTMLElement = document.getElementById("layer-" + this.id);
		this.id = id;
		HTMLLabel.setAttribute("id", "layer-" + this.id);
	}

	public clear(){
		this.destCTX.clearRect(0, 0, this.width, this.heigth);
		this.update_preview();
	}

	public drawImg = (img : HTMLImageElement) => {
		this.destCTX.globalCompositeOperation = "source-over";
		this.destCTX.drawImage(img,0,0);
		this.update_preview();
	}

	makeSelected() {
		var HTMLElem = document.getElementById("layer-" + this.id);
		HTMLElem.setAttribute("class", "selected layer");
	}

	unselect() {
		var HTMLElem = document.getElementById("layer-" + this.id);
		HTMLElem.setAttribute("class", " layer");
	}

	public update_preview() {
		this.prevCTX.clearRect(0, 0, this.prevCVS.width, this.prevCVS.height);
		this.prevCTX.drawImage(this.destCVS,0,0,this.prevCVS.width, this.prevCVS.height);
	}

	public selectedByRemote(color: string) {
		var HTMLElem = document.getElementById("layer-" + this.id);
		HTMLElem.style.backgroundColor = color;
	}

	public unselectedByRemote() {
		var HTMLElem = document.getElementById("layer-" + this.id);
		HTMLElem.style.backgroundColor = "#FFFFFF";
	}

	 
	private change_visibilityF = (e : MouseEvent = null) => {
		e.stopPropagation();
		console.log(e.target);
		// e.target.setAttribute("type", "button");
		// e.target.style.backgroundImage = "url(../../../static/img/eyec.png)";
		// rimuovere visibility del filter aggiornando il json
		// e richiedendo l'immagine ricalcolata con tutti i filtri tranne questo
		// inoltre cambiare l'immagine del'occhietto
	}

	public applyFilter(filterName : string){
		console.log("APPLY FILTER : ");
		console.log(filterName);
		console.log("---------");

		var newHTMLEye = document.createElement("input");
		newHTMLEye.setAttribute("type", "button");
		newHTMLEye.setAttribute("class", "butvisF");
		newHTMLEye.setAttribute("id", "butvisF-" +filterName );
		newHTMLEye.addEventListener("click", this.change_visibilityF);
		
		var newHTML = document.createElement("h4");
		newHTML.innerHTML = filterName ;
		newHTML.appendChild(newHTMLEye);
				
		this.htmlIn.appendChild(newHTML);
	}

}