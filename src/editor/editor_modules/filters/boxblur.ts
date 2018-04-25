/// <reference path="./../../../_all.d.ts" />
import {Gaussian} from "./gaussianBlur.ts";
import {Pixelate} from "./pixelate.ts";
import {GrayScale} from "./grayScale.ts";
import {Sharpen} from "./sharpen.ts";

export class FilterContainer {
    private output : ImageData;

    constructor(imageData : ImageData, filter : any) 
    {
        //var gaussian = new Gaussian();  
        this.output = filter.apply(imageData);
        //console.log(this.output);
    }

    public getOutput(){
        return this.output;
    }
}

export class BoxBlur {
    private pixels : ImageData;
    private blurMask : any;
    private dst : Uint8ClampedArray;
    private tmpCanvas: HTMLCanvasElement;
    private tmpCtx : CanvasRenderingContext2D;
    private width : number;
    private height : number;
    public type = "boxblur";
    
    constructor() {
        this.blurMask = [1 / 9, 1 / 9, 1 / 9,  // this is the mask to apply for the box blur. 
                        1 / 9, 1 / 9, 1 / 9,
                        1 / 9, 1 / 9, 1 / 9];
    };

    public apply(theData : ImageData) {
        var output = this.convolve(theData, this.blurMask, false);
        return output;
    }

    private convolve(theData : ImageData,  weights : any, opaque : any ) {
        console.log("Convolving!!!!!!");
        this.pixels = theData;
        this.width = this.pixels.width;
        this.height = this.pixels.height;

        this.tmpCanvas = document.createElement("canvas");
        this.tmpCtx = this.tmpCanvas.getContext("2d");
        var output = this.tmpCtx.createImageData(this.width, this.height);
        this.dst = output.data;

        var alphaFac = opaque ? 1 : 0;
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side / 2);

        var src = this.pixels.data;
        
        //Loop over the image.
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var sy = y;
                var sx = x;
                var dstOff = (y * this.width + x) * 4; // this is the offset to not overwrite the pixels channels


                var r = 0, g = 0, b = 0, a = 0;
                for (var cy = 0; cy < side; cy++) {
                    for (var cx = 0; cx < side; cx++) {
                        var scy = sy + cy - halfSide;
                        var scx = sx + cx - halfSide;
                        //if (scy >= 0 && scy < this.height && scx >= 0 && scx < this.width) {
                            
                            var newscy = this.circular(this.height, scy);
                            var newscx = this.circular(this.width,  scx);
                            var srcOff = (newscy * this.width + newscx) * 4;

                            var wt = weights[cy * side + cx];
                            r += src[srcOff] * wt;
                            g += src[srcOff + 1] * wt;
                            b += src[srcOff + 2] * wt;
                            a += src[srcOff + 3] * wt;
                        //}
                    }
                }
                this.dst[dstOff] = r; this.dst[dstOff + 1] = g; this.dst[dstOff + 2] = b;
                this.dst[dstOff + 3] = a + alphaFac * (255 - a);
            }
        }
        return output;

    }

    private circular( M :number,x: number)
    {
        if (x<0)
            return x+M;
        if(x >= M)
            return x-M;
        return x;
    }
}