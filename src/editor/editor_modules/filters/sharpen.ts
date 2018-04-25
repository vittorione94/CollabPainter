export class Sharpen {
    private pixels : ImageData;
    private blurMask : any;
    private dst : Uint8ClampedArray;
    private tmpCanvas: HTMLCanvasElement;
    private tmpCtx : CanvasRenderingContext2D;
    private width : number;
    private height : number;
    public type = "sharpening";
    constructor() {
        this.blurMask = [ 0, -1,  0,
                         -1,  5, -1,
                          0, -1,  0 ];
    };

    public apply(theData : ImageData) {
        var output = this.convolve(theData, this.blurMask, false);
        return output;
    }

    public getKernel(){
        return this.blurMask;
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
                        if (scy >= 0 && scy < this.height && scx >= 0 && scx < this.width) 
                        {
                            var srcOff = (scy*this.width+scx)*4;
                            var wt = weights[cy*side+cx];
                            r += src[srcOff] * wt;
                            g += src[srcOff+1] * wt;
                            b += src[srcOff+2] * wt;
                            a += src[srcOff+3] * wt;
                        }
                        
                    }
                }
                this.dst[dstOff] = r; this.dst[dstOff + 1] = g; this.dst[dstOff + 2] = b;
                this.dst[dstOff + 3] = a + alphaFac * (255 - a);
            }
        }

        return output;
    }
}
