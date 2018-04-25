import {SyncEvent} from "ts-events";
import {Editor} from "../editor";


export class userInterface{
	private color :any ;
	private cursor:any ;
}

export class Interface {
	public _theButtons : Array<Button>;

	constructor() { this._theButtons = new Array<Button>(); 	}

	addButton (theButton : Button) { this._theButtons.push(theButton); }

	initButtons() {
		for (let button of this._theButtons){
			 button.changeProp();
		}
	}
}

export class Button {

	button_name : string;
	button_prop : HTMLInputElement ;
	button_prop_label : HTMLElement ;

	public changeEvent = new SyncEvent();
	public clickEvent = new SyncEvent();

	constructor( theElement : HTMLInputElement, theString : string, theLabel : HTMLElement = null  ) {

		this.button_prop = theElement;
		this.button_name = theString;

		if (theLabel) {
			this.button_prop_label = theLabel;
			this.button_prop_label.innerHTML = this.button_prop.value;
		}
		this.button_prop.addEventListener("change", this.changeProp, false);
		this.button_prop.addEventListener("click", this.clickButton, false);
	};


	public changeProp = (e : MouseEvent = null) => {
		if (this.button_prop_label){
			this.button_prop_label.innerHTML = this.button_prop.value;
		}
		this.changeEvent.post(this);
	}

	public clickButton = (e : MouseEvent = null) => {
		if (this.button_prop_label){
			this.button_prop_label.innerHTML = this.button_prop.value;
		}
		this.clickEvent.post(this);

	}
}

export class EventHandler {

	itf : Interface ;
	edt : Editor;

	constructor (theInterface : Interface , theEditor : Editor) {
		this.itf = theInterface ;
		this.edt = theEditor;
	}

	addButton(theButton : Button) {
		theButton.changeEvent.attach( this.handlerChange);
		theButton.clickEvent.attach( this.handlerClick);
	};

	updateButtons() {
		for (let button of this.itf._theButtons){
				button.changeEvent.attach( this.handlerChange);
				button.clickEvent.attach( this.handlerClick);
			}
	};

	private manageOpButt( id: string){
		var elements = document.getElementsByName("operations");
		for (var i = 0; i < elements.length; i++ ) {
			elements[i].setAttribute("style", "display = 'none'");
		}
		var elements = document.getElementsByName("operations_button");
		for (var i = 0; i < elements.length; i++ ) {
			elements[i].parentElement.setAttribute("class", "");
		}
		document.getElementById(id).parentElement.setAttribute("class", "selected");
		document.getElementById(id+'_op').setAttribute("style", "display : inline");
}

	private manageTexBrushButt( id: string){
			var elements = document.getElementsByName("tex_brush_img");
			for (var i = 0; i < elements.length; i++ ) {
				elements[i].parentElement.setAttribute("class", "");
			}
			document.getElementById(id).parentElement.setAttribute("class", "selected");
			console.log(id + 'selected');
	}


	private handlerChange = ( s: Button ) => {
		this.edt.updateBrush(s);
		switch (s.button_name) {
			case "addLayer":
				var layerArea = new Button(<HTMLInputElement>document.getElementById("layer-" + String(this.edt.layers.length - 1)), "layer");
				this.itf.addButton(layerArea);
				this.addButton(layerArea);
			break;
			case "tex_brush_img1":
			case "eraser_square":
				this.manageTexBrushButt(s.button_name);
			break;
		}
	};

	private handlerClick = ( s: Button ) => {
		switch (s.button_name) {
			case "addLayer":
				this.edt.clickElem(s);
				var layerArea = new Button(<HTMLInputElement>document.getElementById("layer-" + String(this.edt.layers.length - 1)), "layer");
				this.itf.addButton(layerArea);
				this.addButton(layerArea);
			break;

			case"eraser":
			case"texbrush":
			case"selection":
			case"brush":
				this.manageOpButt(s.button_name);
				this.edt.clickElem(s);
			break;

			case"gaussian":
				this.manageOpButt(s.button_name);
			case "tex_brush_img1":
			case "tex_brush_img2":
			case "tex_brush_img3":
			case "eraser_circle":
			case "eraser_square":
				this.manageTexBrushButt(s.button_name);
				this.edt.clickElem(s);
			break;

			default:
				this.edt.clickElem(s);

			break;
		}
	};
};

