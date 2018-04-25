export class Pixelate 
{
    private pixels : ImageData;
    private Mask : any;
    private tmpCanvas: HTMLCanvasElement;
    private tmpCtx : CanvasRenderingContext2D;
    private radius : number;
    public type = "pixelate";
    constructor(factor : number)
    {
        
        this.radius = factor;
    }

    private pixelateAlgorithm(imageData : ImageData)
    {
        if(this.radius == 1 || this.radius == 0){return imageData;}
        //console.log("executing the algorithm");
        this.pixels = imageData;
        var src = this.pixels.data;

        var width = this.pixels.width; // Is an unsigned long representing the actual width, in pixels, of the ImageData.
        var height = this.pixels.height; //Is an unsigned long representing the actual height, in pixels, of the ImageData.

        this.tmpCanvas = document.createElement('canvas');
        this.tmpCtx = this.tmpCanvas.getContext('2d');
        var output = this.tmpCtx.createImageData(width, height);
        var dst = output.data;

        var delta = (2*this.radius);

        for(var y = this.radius; y < (height - this.radius); ) { 

            for(var x = this.radius; x < (width - this.radius); ) { 
                
                var srcOff = ((width * y) + x) * 4;
                var r = src[srcOff]; 
                var g = src[srcOff + 1]; 
                var b = src[srcOff + 2];
                var a = src[srcOff + 3];
                //console.log(r);
                for(var ny = -this.radius; ny < this.radius; ny++) { 
                    for(var nx = -this.radius; nx < this.radius; nx++) { 
                        dst[((width * (y + ny)) + (x + nx)) * 4] = r ; 
                        dst[((width * (y + ny)) + (x + nx)) * 4 + 1] = g ;  
                        dst[((width * (y + ny)) + (x + nx)) * 4 + 2] = b ;
                        dst[((width * (y + ny)) + (x + nx)) * 4 + 3] = a ;  
                    } 
                } 
                
                for(var i = 0; i < delta; i++){x++;} // x+=delta
            }
            for(var i = 0; i < delta; i++){y++;} // y+=delta
        } 
        //console.log(src);
        console.log(dst.length);

        return output ; 
    }

    public apply(theData : ImageData) 
    {
        //console.log(this.Mask);
        //console.log("applying pixelate");
        var output = this.pixelateAlgorithm(theData);
        return output;
    }
}