/// <reference path="_all.d.ts" />

import * as SocketIO from "socket.io";
import { Dag } from './dag';

var file = 'systemJson.json'

export class SocketHand{
  private sock  : any;
  private sid ;
  private jsondiffpatch : any;
  private jsonfile : any;
  private dag : Dag;

  constructor(theSocket : SocketIO.Server, sid : string, jsondiffpatch : any, jsonfile : any){
    this.sock = theSocket;
    this.sock.on("disconnect", this.diconnect);
    this.sock.on("connected", this.connectUser);
    this.sock.on("saving_op", this.saveOp);
    this.sock.on("saving_json", this.saveJson);
    this.sock.on("createlayer", this.createLayer);
    this.sock.on("selectlayer", this.layerselected);
    this.sock.on("moveMouse", this.mouseMove);
    this.sid = sid; 
    this.jsondiffpatch = jsondiffpatch;
    this.jsonfile = jsonfile;
    //SINCRONIZZO IL NUOVO UTENTE CON LO STATO INIZIALE DEL SISTEMA
    var sock = this.sock;
    this.jsonfile.readFile(file, function(err, json_sys) {
      sock.emit("initialSync", { json_sys: json_sys });
    })
    this.dag = new Dag(this.sid);
  }

  private diconnect = (data : any) =>  {
    console.log("A user disconnected");
    console.log("------------");
  }

   private mouseMove = (data : any) =>  {
     //this.sock.broadcast.emit("movingMouse", { data: data.data ,ray:data.ray,user_color:data.user_color});
   }

  private connectUser = (socket : any) =>  {
      console.log("MY SID:");
      // console.log(this.sid);
      // dic[this.sid] = socket;
      console.log("A user is Connected");
    };

    private layerselected = (data : any) =>  {
      console.log("layer selected");
      this.sock.broadcast.emit("layerselected", { data: data });
    };

    private createLayer = (data : any) =>  {
      this.sock.broadcast.emit("layercreated", { data: data });
    };

    private saveOp = (data : any) =>  {
      console.log("RICEVUTA");
      this.dag.saveOp(data.brush, data.hash,data.layer_id);
      this.sock.emit("saved_op", { data: data });
      this.sock.broadcast.emit("saved_op", { data: data });
    };

    private saveJson = (data : any) =>  {
      console.log(data);    
      //Leggo il json da file, e poi lo riscrivo una volta patchato
      var jsondiffpatch = this.jsondiffpatch;
      var sock = this.sock;
      var jsonfile = this.jsonfile;
      jsonfile.readFile(file, function(err, json_sys) {
        var delta = jsondiffpatch.diff(json_sys, data);
        console.log(delta);
        jsondiffpatch.patch(json_sys, delta);
 
        //scrivo json_sys sul file;
        jsonfile.writeFile(file, json_sys, function (err) {
          console.error(err);
        });
                    
         //broadcasto solo il delta di differenza
        sock.emit("saved_json", { data: json_sys });
        sock.broadcast.emit("saved_json", { data: json_sys });
      })
    };

}