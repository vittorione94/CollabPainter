export class GrayScale 
{
    private pixels : ImageData;
    private Mask : any;
    private tmpCanvas: HTMLCanvasElement;
    private tmpCtx : CanvasRenderingContext2D;
    public type = "grayscale";
    constructo(){}
    private grayScaleAlgorithm(data : ImageData)
    {

        this.pixels = data;
        var src = this.pixels.data;


        var width = this.pixels.width; // Is an unsigned long representing the actual width, in pixels, of the ImageData.
        var height = this.pixels.height; //Is an unsigned long representing the actual height, in pixels, of the ImageData.

        for(var i = 0; i < src.length; i+=4){
            var r = src[i];
            var g = src[i+1];
            var b = src[i+2];
            
            //Gray = (Red * 0.299 + Green * 0.587 + Blue * 0.114)

            src[i] = r * 0.299 +g * 0.587 + b * 0.114;
            src[i+1] = r * 0.299 +g * 0.587 + b * 0.114;
            src[i+2] = r * 0.299 +g * 0.587 + b * 0.114; 
        }

        return this.pixels;
    }

    public apply(theData : ImageData) 
    {
        //console.log(this.Mask);
        var output = this.grayScaleAlgorithm(theData);
        return output;
    }
}