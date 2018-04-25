import {Layer, LayerContainer} from './layer'

export class Selector {

	public canvas: HTMLCanvasElement;

	public element : HTMLDivElement;
	public oldelement: HTMLDivElement;
	public mouse: Number[] = [0,0,0,0]
	public width: number;
	public height: number;
	public layer: Layer;
	public durl: string;
	public left: number;
	public top: number;
	
	constructor(canvas: HTMLCanvasElement, layer: Layer) {
		this.canvas = canvas;
		this.element = null;
		this.oldelement = null;
		this.canvas.addEventListener('click', this.onclick, false);
	 	this.canvas.addEventListener('mousemove', this.onmousemove, false);
		this.width = this.canvas.offsetWidth;
		this.height = this.canvas.offsetHeight;
		this.left = this.canvas.offsetLeft;
		this.top = this.canvas.offsetTop;
		
		this.layer = layer;
	}

	public setMousePosition(e: MouseEvent) {
		this.mouse[0] = e.pageX;
		this.mouse[1] = e.pageY;	
    };

	public shut_events() {
		this.canvas.removeEventListener('click', this.onclick, false);
	 	this.canvas.removeEventListener('mousemove', this.onmousemove, false);
		this.canvas.removeEventListener('dragover',this.drag_over,false); 
		this.canvas.removeEventListener('drop',this.drop,false); 

	};

    private onmousemove = (e: MouseEvent) => {
	    this.setMousePosition(e);
		if (this.element !== null && this.mouse[0]<(this.width+this.left) && this.mouse[1]<(this.height+this.top)) {
            this.element.style.width = Math.abs(+this.mouse[0] - +this.mouse[2]) + 'px';
            this.element.style.height = Math.abs(+this.mouse[1] - +this.mouse[3]) + 'px';
            this.element.style.left = (+this.mouse[0] - +this.mouse[2] < 0) ? this.mouse[0] + 'px' : +this.mouse[2] + 'px';
            this.element.style.top = (+this.mouse[1] - +this.mouse[3] < 0) ? +this.mouse[1] + 'px' : +this.mouse[3] + 'px';
        }
    };

	//  Dragging the selection tool
	private drag_start = (event: DragEvent) => {
		var style = window.getComputedStyle(event.toElement , null);
		event.dataTransfer.setData("text/plain",
		(parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - event.clientY));
	}

	private drag_over = (event: DragEvent) => {		
		event.preventDefault(); 
		return false; 
	} 
	private drop = (event: DragEvent) => { 
		var offset = event.dataTransfer.getData("text/plain").split(',');
	    var dm = document.getElementById('rectangle_old');
		var w = event.clientX + parseInt(offset[0],10);
		var h = event.clientY + parseInt(offset[1],10);
		
		if(w+dm.offsetWidth/2<this.width && w>this.left && h+dm.offsetHeight/2<this.height && h>this.top) {
			dm.style.left = w + 'px';
			dm.style.top = h + 'px';
		}
		event.preventDefault();
		return false;
	} 

    private onclick = (e: MouseEvent) => {
        if (this.element !== null) {
            this.element.id = 'rectangle_old'
			this.element = null;

			var dm = document.getElementById('rectangle_old');

			var width = +(dm.style.width.slice(0,-2));
			var height = +(dm.style.height.slice(0,-2));
			var left = +(dm.style.left.slice(0,-2)) - (+this.left);
			var top = +(dm.style.top.slice(0,-2))  - (+this.top);

			// Retrieve the area of canvas drawn on.
			var imageData = this.layer.destCTX.getImageData(left, top, width, height);

			// Create a new canvas and put the retrieve image data on it
			var newCanvas = document.createElement("canvas");
			newCanvas.width = width;
			newCanvas.height = height;

			newCanvas.getContext("2d").putImageData(imageData, 0, 0);

			// Now call save to file with your new canvas
			this.durl = newCanvas.toDataURL("image/png");

			dm.style.backgroundImage = 'url(' + this.durl + ')';

			this.layer.destCTX.clearRect(left, top, width, height);


        } else {
			var elem = document.getElementById('rectangle_old');
			if(elem != null) {
				//rilascia il contenuto nel layer corrente
				var img = new Image;
				var layer = this.layer;
				var left = +(elem.style.left.slice(0,-2)) - (+this.left);
				var top = +(elem.style.top.slice(0,-2))  - (+this.top);

				img.onload = function(){
					layer.destCTX.drawImage(img,left,top);
				};
				img.src = this.durl;

            	elem.remove();
			}

            this.mouse[2] = this.mouse[0];
			this.mouse[3] = this.mouse[1];
            this.element = document.createElement('div');
            this.element.className = 'rectangle'
            this.element.id = 'rectangle_new'
            this.element.style.left = this.mouse[0] + 'px';
            this.element.style.top = this.mouse[1] + 'px';
			document.body.appendChild(this.element);
			//abilita il drag and drop per element
			this.element.setAttribute("draggable", "true");
			this.element.addEventListener('dragstart',this.drag_start,false); 
			this.element.addEventListener('click', this.onclick, false);
		 	this.element.addEventListener('mousemove', this.onmousemove, false);
			this.canvas.addEventListener('dragover',this.drag_over,false); 
			this.canvas.addEventListener('drop',this.drop,false); 

        }
    };
}

export class Brush {

	public r : number ;
	public g : number ;
	public b : number ;
	public a : number ;

	constructor(){
		
	}

	private updateBrush(red : number, green : number, blue : number, alpha : number){
		this.r = red;
		this.g = green;
		this.b = blue;
		this.a = alpha;
	}

	public getRGBAstring(){
		return this.r+', '+this.g+', '+this.b+', '+this.a;
	}

	public getRGBstring(){
		return this.r+', '+this.g+', '+this.b;
		
	}

	public draw(actx : CanvasRenderingContext2D, dctx : CanvasRenderingContext2D, rgbcvs : HTMLCanvasElement,x: number,y: number,w: number){		
		var rgbctx = rgbcvs.getContext("2d");
		rgbctx.beginPath();			
		rgbctx.arc(x, y, w, 0, 2 * Math.PI);
		rgbctx.fillStyle = 'rgb('+this.getRGBstring()+')';
		rgbctx.fill();
		rgbctx.closePath();
		
		actx.clearRect(0, 0, rgbcvs.width, rgbcvs.height);
		actx.drawImage(rgbcvs,0,0);

	};

}


export class Smudge {	
	private smudgeColorArray : any= null;
	private smudgeImageData : any;
	private isDrawing = false;
	private canvas : any;

	private x : number = 0;
	private y : number = 0;
	private lastX : number;
	private lastY : number;

	private width: number;
	private height: number;

	constructor(width: number,height: number ){
		//console.log("smudge constructor");
		// this.canvas = canvas;
		
		this.width = width;
		this.height = height;
	}

    public  grabSmudgeData( ctx : CanvasRenderingContext2D,cvs : any, x :any, y:any ) {
		this.canvas = cvs;

        var colors = ctx.getImageData(x-5,y-5,9,9);
        if (this.smudgeColorArray == null) {
            this.smudgeImageData = ctx.createImageData(9,9);
            this.smudgeColorArray = new Float32Array(colors.data.length);
        }
        for (var i = 0; i < colors.data.length; i++) {
            this.smudgeColorArray[i] = colors.data[i];
        }
		//console.log(colors);
    };

	private applyToolAlongLine(ctx:any, x1:any, y1:any, x2:any, y2:any) {
        var x:any, y:any, slope:any;
        if (Math.abs(x1-x2) >= Math.abs(y1-y2)) {
               // Horizontal distance is greater than vertical distance.  Apply the
               // tool once for each x-value between x1 and x2, computing the
               // y-value for each x-value from the equation of a line. 
            slope = (y2-y1)/(x2-x1);
            if (x1 <= x2) { // Increment up from x1 to x2.
                for (x = x1; x <= x2; x++) {
                    y = Math.round(y1 + slope*(x-x1));
					if(!isFinite(y)){y=0;} 
                    this.draw(ctx,x,y);
                }
            }
            else { // Decrement down from x1 to x2
                for (x = x1; x >= x2; x--) {
                    y = Math.round(y1 + slope*(x-x1));
					if(!isFinite(y)){console.log("p2");}
                    this.draw(ctx,x,y);
                }
            }
        }
        else {
               // Vertical distance is greater than horizontal distance.  Apply the
               // tool once for each y-value between y1 and y2, computing the
               // x-value for each y-value from the equation of a line. 
            slope = (x2-x1)/(y2-y1);
            if (y1 <= y2) {  // Increment up from y1 to y2.
                for (y = y1; y <= y2; y++) {
                    x = Math.round(x1 + slope*(y-y1));
					if(!isFinite(x)){console.log("p3");}
                    this.draw(ctx,x,y);
                }
            }
            else {  // Decrement down from y1 to y2.
                for (y = y1; y >= y2; y--) {
                    x = Math.round(x1 + slope*(y-y1));
					if(!isFinite(x)){console.log("p4");}
                    this.draw(ctx,x,y);
                }
            }
        }
        //repaint();
		//ctx.drawImage(this.canvas, 0,0 );
    }

    private draw( ctx:any, x:any , y:any ) {
		//

		var colors = ctx.getImageData(x-5,y-5,9,9);  // get color data form image

		for (var i = 0; i < this.smudgeColorArray.length; i += 4) {

			//if (this.smudgeColorArray[i+3] && colors.data[i+3]) {
                for (var j = i; j < i +4 ; j++) {
					if(j != i+3){
						var newSmudge = (this.smudgeColorArray[j]*0.8+ colors.data[j]*0.2 ) * this.smudgeColorArray[i+3];
						var newImage  = (this.smudgeColorArray[j]*(this.smudgeColorArray[i+3]/255) + colors.data[j]*(255 - this.smudgeColorArray[i+3])/255)* this.smudgeColorArray[i+3];
						this.smudgeImageData.data[j] = newImage;
						this.smudgeColorArray[j] = newSmudge;
					}
					else{
						var newSmudge = this.smudgeColorArray[j]* 0.8+ colors.data[j]*0.2;
						var newImage  = this.smudgeColorArray[j]*(this.smudgeColorArray[i+3]/255) + colors.data[j]*(255 - this.smudgeColorArray[i+3])/255;
						this.smudgeImageData.data[j] = newImage;
						this.smudgeColorArray[j] = newSmudge;
					}
					
                }
                //this.smudgeImageData.data[i+3] = 255;
            //}
            //else {
              //  for (var j = i; j <= i+3; j++) {
				//	console.log(colors.data[j]);
                  //  this.smudgeImageData.data[j] = 255; // "transparent black"; will have no effect on the image
               // }				
            //}
			ctx.globalCompositeOperation = "source-over";
			ctx.putImageData(this.smudgeImageData,x-5,y-5);
		}
        
	}    
}



















export class TexBrush {

	public r : number ;
	public g : number ;
	public b : number ;
	
	public image : HTMLImageElement ;
	public coloredImage : HTMLImageElement ;
	private pathToImg : string = '../../../static/img/';
	private distance : number;

	constructor(brushImg:string){
		this.image = new Image();
		this.coloredImage = new Image();
		this.setImg(brushImg);
	}

	public changeColor() {
		var c = document.createElement('canvas');
		c.width = this.image.width;
		c.height = this.image.height;
		var ctx = c.getContext('2d');
		ctx.drawImage(this.image, 0, 0);
		var imgData=ctx.getImageData(0, 0, c.width, c.height);
		for (var i=0;i<imgData.data.length;i+=4)
		{
			imgData.data[i]= this.r;
			imgData.data[i+1]= this.g;
			imgData.data[i+2]= this.b;
		}
		ctx.putImageData(imgData,0,0);
		
		this.coloredImage.src = c.toDataURL();		

	}

	public draw(actx : CanvasRenderingContext2D, dctx : CanvasRenderingContext2D, rgbcvs : HTMLCanvasElement, x: number,y: number,w: number,dist : number){		
		var rgbctx = rgbcvs.getContext("2d");
		rgbctx.drawImage(this.coloredImage, x-w/2, y-w/2, w, w);
		actx.clearRect(0, 0, rgbcvs.width, rgbcvs.height);
		actx.drawImage(rgbcvs,0,0);
	};

	public setImg(brushImg:string){
		this.image.src = this.pathToImg+brushImg;
		var textbrush = this;
		this.image.onload = function() {
			textbrush.changeColor();
		}
	}

}

export class Eraser {

	public shape : string = "square";

	constructor(){
	}

	public draw(actx : CanvasRenderingContext2D, dctx : CanvasRenderingContext2D, rgbcvs : HTMLCanvasElement = null,x: number,y: number,w: number){		
		dctx.beginPath();			
		this.shape==="square"?dctx.rect(x-(w/2), y-(w/2), w, w):dctx.arc(x, y, w, 0, 2 * Math.PI);
      	dctx.fill();
		dctx.closePath();

		var rgbctx = rgbcvs.getContext("2d");
	
		rgbctx.beginPath();			
		this.shape === "square"?rgbctx.rect(x-(w/2), y-(w/2), w, w):rgbctx.arc(x, y, w, 0, 2 * Math.PI);
		rgbctx.fillStyle = 'rgb(255,255,255)';
      	rgbctx.fill();
		rgbctx.closePath();

	};

}
