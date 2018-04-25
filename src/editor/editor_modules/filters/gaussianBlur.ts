export class Gaussian {
    private pixels : ImageData;
    private Mask : any;
    private dst : Uint8ClampedArray;
    private tmpCanvas: HTMLCanvasElement;
    private tmpCtx : CanvasRenderingContext2D;
    private width : number;
    private height : number;
    public type = "gaussian";
    
    constructor(radius : number)
    {
        this.Mask = [];

        var size = 2*radius + 1;
        var matlength = Math.pow(size,2);
        
        var sum = 0;
        var sigma = 0.333333 * radius;
        var i = 0;
        for(var y=-radius; y <= radius; y++)
        {
            for(var x=-radius; x <= radius; x++)
            {
                var first = 1/(2 * Math.PI * Math.pow(sigma, 2));
                var exponent = ((Math.pow(x,2) + Math.pow(y,2))/(2 * Math.pow(sigma, 2)));
                var output = first * Math.pow(Math.E, -exponent);
                this.Mask[i] = output;
                sum += output;
                ++i;
            }
        }

        //console.log(i == matlength); --> true
        //Normalizzazione kernel
        for(var i = 0; i < matlength; i++){
            this.Mask[i]/=sum;
        }

        console.log("radius : " + radius + "  mask :  " + this.Mask.length );
    }

    public apply(theData : ImageData) 
    {

        console.log(this.Mask);
        var output = this.convolve(theData, this.Mask, false);
        return output;
    }

    public convolve(theData : ImageData,  weights : any, opaque : any ) 
    {
        console.log("Convolving!!!!!!");
        //this.pixels = theData;
        if(weights.length <= 1){
            return theData;
        }
        this.width = theData.width;
        this.height = theData.height;

        var tmpCanvas = document.createElement("canvas");
        var tmpCtx = tmpCanvas.getContext("2d");
        var output = tmpCtx.createImageData(this.width, this.height);
        var dst = output.data;

        var alphaFac = opaque ? 1 : 0;
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side / 2);

        var src = theData.data;
        
        //Loop over the image.
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                /*
                var tmp = (y * this.width + x) * 4;
                src[tmp]*= src[tmp+3];
                src[tmp+1]*= src[tmp+3];
                src[tmp+2]*= src[tmp+3];
                */

                var sy = y;
                var sx = x;
                var dstOff = (y * this.width + x) * 4; // this is the offset to not overwrite the pixels channels
                
                var r = 0, g = 0, b = 0, a = 0, prime = 0;
                for (var cy = 0; cy < side; cy++) {
                    for (var cx = 0; cx < side; cx++) {
                        var scy = sy + cy - halfSide;
                        var scx = sx + cx - halfSide;
                            
                        var newscy = this.circular(this.height, scy);
                        var newscx = this.circular(this.width,  scx);
                        var srcOff = (newscy * this.width + newscx) * 4;

                        //src[srcOff] *= src[srcOff+3]; 

                        var wt = weights[cy * side + cx];
                        
                        prime =  src[srcOff + 3] ;
                        //a += src[srcOff + 3] * wt ;

                        r += src[srcOff]     * wt * prime;
                        //dst[dstOff] += r;
                        //dst[dstOff] = dst[dstOff] + src[srcOff]*(1-a);

                        g += src[srcOff + 1] * wt * prime;
                        //dst[dstOff] += r;
                        //dst[dstOff] = dst[dstOff] + src[srcOff]*(1-a);

                        b += src[srcOff + 2] * wt * prime;
                        
                        a += src[srcOff + 3] * wt ;

                     }
                 }

                 dst[dstOff] = r / a;
                 //dst[dstOff] = dst[dstOff] + src[dstOff]*(1-a);
                 
                 dst[dstOff + 1] = g / a;
                 //dst[dstOff + 1] = dst[dstOff + 1] + src[dstOff + 1]*(1-a);
                 
                 dst[dstOff + 2] = b  / a;
                 //dst[dstOff + 2] = dst[dstOff + 2] + src[dstOff + 2]*(1-a);

                 dst[dstOff + 3] = a + alphaFac * (255 - a);
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

     public getKernel(){
         return this.Mask;
     }
 }