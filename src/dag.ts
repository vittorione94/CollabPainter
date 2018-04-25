/// <reference path="_all.d.ts" />

// import {History} from "./editor/editor_modules/history.ts"
var fs = require("fs");
import * as console from 'console';

export class Dag {
    
    private session : string;
    // private json : any ;
    private path : string;

    constructor( session : string){
        this.session = session;
        this.path = './server_img/'+session;

        // created folder for user
        if (!fs.existsSync(this.path)){
            fs.mkdirSync(this.path);
        }
    }

    public saveOp(imgData : string, id:number, layer_id : number){  
        var base64Data = imgData.replace(/^data:image\/png;base64,/, "");
        //  LET's use imagemagick
        // convert INFILE.png -set Title "foobar the great" OUTFILE.png
        fs.writeFileSync(this.path+"/"+id+".png", base64Data, 'base64');
    }  
}


// export class ClientDag {
//     private dag : Dag;
//     constructor(theHistory : History){
//         this.dag = new Dag (theHistory);
//     }
// }

// export class Dag{

//   constructor(theHistory : History){
//       console.log("Gino");
//   }


 // public dumpToJSON(){    
    //     var dumpable = {
    //         user: this.session,
    //         ops : [{ }] ,
    //         global_ops : [{ }],
    //     };
    //     this.json = dumpable;
    // }

// }