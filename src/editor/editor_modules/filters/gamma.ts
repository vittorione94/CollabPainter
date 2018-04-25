export class GammaCorrection 
{
    private pixels : ImageData;
    private tmpCanvas: HTMLCanvasElement;
    private tmpCtx : CanvasRenderingContext2D;
    private factor : number;
    public type = "gamma";
    constructor(factor : number)
    {
        this.factor = factor;
    }
    private gammaAlgorithm(data : ImageData)
    {
        this.pixels = data;
        var src = this.pixels.data;

        var width = this.pixels.width; // Is an unsigned long representing the actual width, in pixels, of the ImageData.
        var height = this.pixels.height; //Is an unsigned long representing the actual height, in pixels, of the ImageData.

        this.tmpCanvas = document.createElement('canvas');
        this.tmpCtx = this.tmpCanvas.getContext('2d');
        var output = this.tmpCtx.createImageData(width, height);
        var dst = output.data; 
        for (var y=0; y<height; y++) 
        {
            for (var x=0; x<width; x++) 
            {
                var dstOff = (y*width+x)*4;
                var r = Math.pow((src[dstOff]/255), this.factor) * 255 ;
                var g = Math.pow((src[dstOff+1]/255), this.factor) * 255 ;
                var b = Math.pow((src[dstOff+2]/255), this.factor) * 255 ;
                var a = Math.pow((src[dstOff+3]/255), this.factor) * 255 ;

                dst[dstOff] = r;
                dst[dstOff+1] = g;
                dst[dstOff+2] = b;
                dst[dstOff+3] = a;// + alphaFac*(255-a);                
            }
        }
        return output;
    }

    public apply(theData : ImageData) 
    {
        //console.log(this.Mask);
        var output = this.gammaAlgorithm(theData);
        return output;
    }
}