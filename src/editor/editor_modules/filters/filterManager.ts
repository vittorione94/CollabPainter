//FILTERS IMPORT
import {FilterContainer} from "./filter";
import {Gaussian} from "./gaussianBlur";
import {Pixelate} from "./pixelate";
import {GrayScale} from "./grayScale";
import {Sharpen} from "./sharpen";
import {BoxBlur} from "./boxblur";
import {GammaCorrection} from "./gamma";
import {SepiaTone} from "./sepiaTone";
import {Layer, LayerContainer} from "../layer";
import {SystemState} from "../systemstate";

export class FilterManager {

	private filter : FilterContainer;
	private systemstate : SystemState;

    constructor(systemstate : SystemState) {
		this.systemstate = systemstate;
	}

	private makeParamPreviewString( width:number , height:number, top :number, left:number){

		var params = 'width='+width+', height='+height;
		params += ', top='+top+', left='+left;
		params += ', directories=no';
		params += ', location=no';
		params += ', menubar=no';
		params += ', resizable=no';
		params += ', scrollbars=no';
		params += ', status=no';
		params += ', toolbar=no';

		return params;
	}

    public applyFilter(filterID: string, sourceImg: ImageData, selectedLayer: Layer) {

        var canvas = selectedLayer.destCVS;
        var ctx = selectedLayer.destCTX;
        var imageData = ctx.getImageData(0,0,canvas.width, canvas.height);
        var source = canvas.toDataURL();
		var parameters: Array<string> = [];

		var width  = 1000;
		var height = 630;
		var left   = (screen.width  - width)/2;
		var top    = (screen.height - height)/2;

		var original_img : ImageData = imageData;

        switch (filterID) {
			case "blur":
				var algorithm = new BoxBlur();
				this.filter = new FilterContainer(imageData, algorithm, undefined);
				var output = this.filter.getOutput();
				ctx.putImageData(output, 0, 0);
			break;
			case "gaussianBlur":

				var preview = window.open("/inputRangePreview", '_blank', this.makeParamPreviewString(width,height,top,left));
				preview.onload = function(){
					
					var canvaspreview : any = preview.document.getElementById('board');
					var previewctx = canvaspreview.getContext('2d');
				
					previewctx.putImageData(imageData, 0, 0);
					//Loded the image inside the preview;

					var input : any = preview.document.getElementById('range');
					
					input.onchange=function(){
						var value = input.value;
						parameters.push(value);
						var algorithm = new Gaussian(value);
						this.filter = new FilterContainer(imageData, algorithm, undefined);
						var output = this.filter.getOutput();
						previewctx.putImageData(output, 0, 0);
					}

					var submit = preview.document.getElementById('submit');
					submit.onclick=function(){
						var imagedata = previewctx.getImageData(0,0,canvaspreview.width, canvaspreview.height);
						ctx.putImageData(imagedata, 0,0);
						preview.close();
					}
				}
				
			break;

			case "gamma":

				var preview = window.open("/inputRangePreview", '_blank', this.makeParamPreviewString(width,height,top,left));

				preview.onload = function(){
					
					var canvaspreview : any = preview.document.getElementById('board');
					var previewctx = canvaspreview.getContext('2d');
				
					previewctx.putImageData(imageData, 0, 0);
					//Loded the image inside the preview;

					var input : any = preview.document.getElementById('factor');
					
					input.onchange=function(){
						var value = input.value;
						parameters.push(value);
						var algorithm = new GammaCorrection(value);
						this.filter = new FilterContainer(imageData, algorithm, undefined);
						var output = this.filter.getOutput();
						previewctx.putImageData(output, 0, 0);
					}

					var submit = preview.document.getElementById('submit');
					submit.onclick=function(){
						var imagedata = previewctx.getImageData(0,0,canvaspreview.width, canvaspreview.height);
						ctx.putImageData(imagedata, 0,0);
						preview.close();
					}
				}
			break;
			case "pixelate":

				var preview = window.open("/inputRangePreview", '_blank', this.makeParamPreviewString(width,height,top,left));

				preview.onload = function(){
					
					var canvaspreview : any = preview.document.getElementById('board');
					var previewctx = canvaspreview.getContext('2d');
				
					previewctx.putImageData(imageData, 0, 0);
					//Loded the image inside the preview;

					var input : any = preview.document.getElementById('range');
					
					input.onchange=function(){
						var value = input.value;
						parameters.push(value);
						var algorithm = new Pixelate(value);
						this.filter = new FilterContainer(imageData, algorithm, undefined);
						var output = this.filter.getOutput();
						previewctx.putImageData(output, 0, 0);
					}

					var submit = preview.document.getElementById('submit');
					submit.onclick=function(){
						var imagedata = previewctx.getImageData(0,0,canvaspreview.width, canvaspreview.height);
						ctx.putImageData(imagedata, 0,0);
						preview.close();
					}
				}
			break;
			case "grayscale":
				var algorithm1 = new GrayScale();
				this.filter = new FilterContainer(imageData, algorithm1, undefined);
				var output = this.filter.getOutput();
				ctx.putImageData(output, 0, 0);
			break;
			case "sepiaTone":
				var algorithm2 = new SepiaTone();
				this.filter = new FilterContainer(imageData, algorithm2, undefined);
				var output = this.filter.getOutput();
				ctx.putImageData(output, 0, 0);	
			break;
			case "sharpen":	
				var algorithm3 = new Sharpen();
				this.filter = new FilterContainer(imageData, algorithm3, undefined);
				var output = this.filter.getOutput();
				ctx.putImageData(output, 0, 0);	
			break;
			case "median":
			/*
				var canvas = this.selectedLayer.destCVS;
				var ctx = this.selectedLayer.destCTX;
				var imageData = ctx.getImageData(0,0,canvas.width, canvas.height);
				var algorithm4 = new MedianFilter();
				this.filter = new FilterContainer(imageData, algorithm4);
				var output = this.filter.getOutput();
				ctx.putImageData(output, 0, 0);
			*/
			break;
			case "gauss-gauss":
				var preview = window.open("/gaussianfusion", '_blank', this.makeParamPreviewString(width,height,top,left));

				preview.onload = function(){
					
					var canvaspreview : any = preview.document.getElementById('board');
					var canvaspreview2 : any = preview.document.getElementById('board2');
					var previewctx : any = canvaspreview.getContext('2d');
					var previewctx2 : any = canvaspreview2.getContext('2d');
					
					previewctx.putImageData(imageData, 0, 0);
					previewctx2.putImageData(imageData, 0, 0);
					//Loded the image inside the preview;

					var input : any = preview.document.getElementById('range');
					var input2 : any = preview.document.getElementById('range2');

					input.onchange=function(){
						var value = input.value;
						parameters.push(value);

						var value2 = input2.value;
						parameters.push(value2);
						
						if(value == 0 && value2 == 0){
							previewctx.putImageData(imageData, 0, 0);
							previewctx2.putImageData(imageData, 0, 0);
						}
						else if(value2 == 0){
							var algorithm5 = new Gaussian(value);

							this.filter = new FilterContainer(imageData, algorithm5, undefined);
							var output = this.filter.getOutput();
							previewctx.putImageData(output, 0, 0);
							previewctx2.putImageData(output, 0, 0);
						}
						
						if(value == 0){
							var algorithm6 = new Gaussian(value2);
							this.filter = new FilterContainer(imageData, algorithm6, undefined);
							var output = this.filter.getOutput();
							previewctx.putImageData(imageData, 0, 0);
							previewctx2.putImageData(output, 0, 0);
						}
						else{
							var algorithm5 = new Gaussian(value);
							var algorithm6 = new Gaussian(value);

							this.filter = new FilterContainer(imageData, algorithm5, algorithm6);
							var output = this.filter.getOutput();
							previewctx.putImageData(output, 0, 0);
							previewctx2.putImageData(output, 0, 0);
						}
					}
					
					input2.onchange = function (){
						var value = input.value;
						parameters.push(value);

						var value2 = input2.value;
						parameters.push(value2);
						var algorithm5 = new Gaussian(value);
						var algorithm6 = new Gaussian(value2);

						this.filter = new FilterContainer(imageData, algorithm5, algorithm6);
						var output = this.filter.getOutput();
						previewctx.putImageData(output, 0, 0);
						previewctx2.putImageData(output, 0, 0);
					}
					
					var submit = preview.document.getElementById('submit');
					submit.onclick=function(){
						var imagedata = previewctx.getImageData(0,0,canvaspreview.width, canvaspreview.height);
						ctx.putImageData(imagedata, 0,0);
						preview.close();
					}
				}
			break;
			default :
				console.log("NOT EXPECTED FILTER ");
				break;
        }

		// il codice fatto in questa maniera ovvero con il CULO 
		// fa si che queste righe vengano triggerate 
		// anche se il sistema non ha concluso. 
		this.systemstate.updateStateFilters(selectedLayer.id, filterID, parameters);
		selectedLayer.applyFilter(filterID);
        // operationContainer.addOperation(socket, selectedLayer.id, source, null, "filter");
    }
}






