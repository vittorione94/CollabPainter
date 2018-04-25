export class MedianFilter 
{   
    private pixels : ImageData;
    private Mask : any;
    private tmpCanvas: HTMLCanvasElement;
    private tmpCtx : CanvasRenderingContext2D;

    constructor(){}
    private medianAlgorithm(data : ImageData)
    {

        this.pixels = data;
        var src = this.pixels.data;


        var width = this.pixels.width; // Is an unsigned long representing the actual width, in pixels, of the ImageData.
        var height = this.pixels.height; //Is an unsigned long representing the actual height, in pixels, of the ImageData.

        this.tmpCanvas = document.createElement('canvas');
        this.tmpCtx = this.tmpCanvas.getContext('2d');
        var output = this.tmpCtx.createImageData(width, height);
        var dst = output.data;

        var red = new Array(9),
            green = new Array(9),
            blue = new Array(9),
            alpha = new Array(9);

        var edgex = Math.round( 3/ 2);
        var edgey = Math.round( 3/ 2);
        for(var x = 0; x < height ; x++)
        {
            for(var y = 0; y < width ; y++)
            {
                var i = 0;
                for(var fx =0; fx < 3; fx++){
                    for(var fy=0; fy < 3; fy++){

                        var imageX = (x - 3 / 2 + fx + width) % width;
                        var imageY = (y - 3 / 2 + fy + height) % height;

                        red[i] = src[ imageY * width + imageX ];
                        green[i] = this.getColorGreen(this.pixels,x + fx - edgex, y + fy - edgey );
                        blue[i] = this.getColorBlue(this.pixels,x + fx - edgex, y + fy - edgey );
                        alpha[i] = this.getColorAlpha(this.pixels,x + fx - edgex, y + fy - edgey );
                        i++;
                    }
                }
            
                var dstOff = (y * width + x) * 4;

                red.sort();
                green.sort();
                blue.sort();
                alpha.sort();
                
                var k = Math.round(3/2);
                dst[dstOff] = red[k];
                dst[dstOff + 1] = green[k];
                dst[dstOff + 2] = blue[k];
                dst[dstOff + 3] = alpha[k];
            }
        }
        
        return output;

    }

    public apply(theData : ImageData) 
    {
        //console.log(this.Mask);
        var output = this.medianAlgorithm(theData);
        return output;
    }

    public getColorRed(image, x, y) { 
        return  image.data[((image.width * y) + x) * 4];
    }

    public getColorGreen(image, x, y){
        return image.data[((image.width * y) + x) * 4 + 1];
    }

    public getColorBlue(image, x, y){
        return image.data[((image.width * y) + x) * 4 + 2];
    }

    public getColorAlpha(image, x, y){
        return image.data[((image.width * y) + x) * 4 +3];
    }

}