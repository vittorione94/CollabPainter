export class FilterContainer {
    private output : ImageData;
    private matrix : any = {gaussian : {sharpening : "eulerianAverage" , greyscale:"order"   , pixelize:"", sepiatone : "order"  , gaussian:"eulerianAverage"},
                     sharpening: {sharpening : "eulerianAverage" , greyscale:"order"   , pixelize:"", sepiatone : "order"  , gaussian:"eulerianAverage"},
                     greyscale:  {sharpening : "order"           , greyscale:"nothing" , pixelize:"", sepiatone : ""       , gaussian:"order"},
                     pixelize:   {sharpening : ""                , greyscale:"order"   , pixelize:"", sepiatone : "order"  , gaussian:""},
                     sepiatone:  {sharpening : "order"           , greyscale:""        , pixelize:"", sepiatone : "nothing", gaussian:"order"}
                     };

    constructor(imageData : ImageData, filter : any, filter2? : any) {   
        if(filter2 == undefined){
            //console.log("sdiufhasudyfsdiufhsdj");
            this.output = filter.apply(imageData);
        }
        else{
            var type1 = filter.type;
            var type2 = filter2.type;

            var solution = this.matrix[type1][type2];

            switch (solution) {
                case "eulerianAverage":
                    console.log("I'm here");
                    var A = filter.getKernel();
                    var B = filter2.getKernel();

                    var la = Math.sqrt(A.length);
                    var lb = Math.sqrt(B.length);

                    var res = this.matrixOp(A, la, B , lb);
                    
                    console.log(res);
                    this.output = filter.convolve(imageData, res, false);
                    
                break;
                case "order":   
                    var out = filter.apply(imageData);

                    var out2 = filter2.apply(out);
                    this.output = out2;

                break;
                case "nothing":
                    this.output = filter.apply(imageData);
                break;
            }
        }     
    }

    public matrixOp(A: any, la :any,B : any ,lb :any){
		console.log("Matrix operation");
		//siano M la matrice piu' grande ed N la matrice piu' piccola
		var M = (A.length>=B.length)?A:B;
		var N = (M==A)?B:A;
        
		//siano m ed n la lunghezza del lato di M ed N rispettivamente
		var m = (M==A)?la:lb;
		var n = (N==A)?la:lb;
		
		//sia out la matrice in output
		var out = new Array(m*m);
		
		//copio M in out
		for(var i=0; i<m;i++){
			for(var j=0; j<m;j++){
				out[i*m + j] = M[i*m +j];
            }
        }
		//prendo la parte intera inferiore di (m-n)/2
		var offset = (m-n)/2; 
		
		//centro N e la sommo ad out
		for(var i=0; i<n; i++){
			for(var j=0; j<n; j++){
				out[(offset + i)*m + (offset + j)] += N[i*n + j] ;
                //out[(offset + i)*m + (offset + j)] /= 2;

            }
        }      
		return out;
	}

    public matrixOp1(A: any, la :any,B : any ,lb :any){
			
		//siano M la matrice piu' grande ed N la matrice piu' piccola
		var M = A.length>= B.length?A:B;
		var N = M==A?B:A;
	
		//siano m ed n la lunghezza del lato di M ed N rispettivamente
		var m = M==A?la:lb;
		var n = N==A?la:lb;
		
		//sia out la matrice in output
		var out = new Array(m*m);
		
		//copio M in out
		for(var i=0; i<m;i++){
			for(var j=0; j<m;j++){
				out[i*m + j] = M[i*m +j];
            }
        }
		//prendo la parte intera inferiore di (m-n)/2
		var offset = (m-n)/2; 
		
		//centro N e la sommo ad out
		for(var i=0; i<n; i++){
			for(var j=0; j<n; j++){
				out[(offset + i)*m + (offset + j)] = (N[i*n + j] + out[(offset + i)*m + (offset + j)]) / 2;
            }
        }      
		return out;
	}




    public getOutput(){
        return this.output;
    }
}






