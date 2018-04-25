export class SepiaTone 
{
    private pixels : ImageData;
    private Mask : any;
    private tmpCanvas: HTMLCanvasElement;
    private tmpCtx : CanvasRenderingContext2D;
    public type = "sepiatone";
    constructor(){}
    private sepiaAlgorithm(data : ImageData)
    {

        this.pixels = data;
        var src = this.pixels.data;


        var width = this.pixels.width; // Is an unsigned long representing the actual width, in pixels, of the ImageData.
        var height = this.pixels.height; //Is an unsigned long representing the actual height, in pixels, of the ImageData.

        for(var i = 0; i < src.length; i+=4){
            var r = src[i];
            var g = src[i+1];
            var b = src[i+2];
            
            r = (r * 0.393) + (g * 0.769) + (b * 0.189); 
            g = (r * 0.349) + (g * 0.686) + (b * 0.168); 
            b = (r * 0.272) + (g * 0.534) + (b * 0.131);

            src[i] = (r > 255) ? 255 : r ; 
            src[i + 1] = (g > 255) ? 255 : g ; 
            src[i + 2] = (b > 255) ? 255 : b ; 
        }

        return this.pixels;
    }

    public apply(theData : ImageData) 
    {
        //console.log(this.Mask);
        var output = this.sepiaAlgorithm(theData);
        return output;
    }
}