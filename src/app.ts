/// <reference path="_all.d.ts" />
"use strict";

import * as bodyParser from "body-parser";

import express = require("express");
import session = require("express-session");

import * as path from "path";
import * as SocketIO from "socket.io";

import {SocketHand} from "./socket";

var url = require("url");
var http = require("http");
var fs = require("fs");
var cookieParser = require("cookie-parser");
var jsondiffpatch = require('jsondiffpatch');
var jsonfile = require('jsonfile');
var file = 'systemJson.json'

var user : any;
var dic = {};

class Server {

  public app: express.Application;
  public static bootstrap(): Server {
    return new Server();
  }

  constructor() {
    //create expressjs application
    this.app = express();
    //configure application
    this.config();
    //configure routes
    this.routes();
  }

  private config() {
    //configure jade
    this.app.set("views", path.join(__dirname, "views"));
    this.app.engine("html", require("ejs").renderFile);
    this.app.use("/static", express.static(__dirname + "/static"));
    this.app.set("view engine", "html");

    this.app.use(cookieParser());

    //mount json form parser
    this.app.use(bodyParser.json());

    //mount query string parser
    this.app.use(bodyParser.urlencoded({ extended: true }));

    //add static paths
    this.app.use(express.static(path.join(__dirname, "public")));
    this.app.use(express.static(path.join(__dirname, "bower_components")));
    this.app.use(session({secret: "SOMERANDOMSECRETHERE", cookie: {secure: false, }}));
  }



  private routes() {
    //get router
    let router: express.Router;
    router = express.Router();
    router.get("/", function(req, res){
      req.session.cookie.expires = false;
      console.log("HO SESSIONE");
      console.log(req.session.id);
      console.log("----------");
      
      res.render("main.html");
    });

    router.get("/inputRangePreview", function(req, res){
    console.log("gaussian request");
    res.sendFile('inputRangePreview.html', {root: path.join(__dirname, '/views')});
    //res.sendFile("../../views/blurPreview.html");
    });

    router.get("/inputNumberPreview", function(req, res){
    res.sendFile('inputNumberPreview.html', {root: path.join(__dirname, '/views')});
    //res.sendFile("../../views/blurPreview.html");
    });
    
    router.get("/image", function(req, res){
    res.sendFile('test.png', {root: path.join(__dirname, '/static/img')});
    //res.sendFile("../../views/blurPreview.html");
    });

    router.get("/gaussianfusion", function(req, res){
    res.sendFile('gaussianfusion.html', {root: path.join(__dirname, '/views')});
    //res.sendFile("../../views/blurPreview.html");
    });

    //use router middleware
    this.app.use(router);
  }
}

class App{
  private port : any;
  private server : Server;
  private server2: any;
  private socket : SocketHand ;
  
  constructor(){
    this.server = Server.bootstrap();

    //get port from environment and store in Express.
    this.port = this.normalizePort(process.env.PORT || 8080);
    this.server.app.set("port", this.port);

    //create http server
    this.server2 = http.createServer(this.server.app);
    var io = SocketIO.listen(this.server2);
    io.on("connection", this.newSocket);
    //listen on provided ports
    this.server2.listen(this.port);
    //add error handler
    this.server2.on("error", this.onError);
    //start listening on port
    this.server2.on("listening", this.onListening);

    //All avvio del server, creo un nuovo file con il json sys dello stato base del sistema.
    var json_sys = { layers: { '0': { inuse: true, order: 0, filters: [], visible: true } } };
    jsonfile.writeFile(file, json_sys, function (err) {
      console.error(err);
    });

  }

  /**   * Normalize a port into a number, string, or false. */
  private normalizePort(val  : any) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {      return val; }
    if (port >= 0) {      return port; }
    return false;
  }

  /**    * Event listener for HTTP server "error" event. */
  private onError(error  : any) {
    if (error.syscall !== "listen") 
      throw error;
    var bind = typeof this.port === "string"
      ? "Pipe " + this.port
      : "Port " + this.port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**   * Event listener for HTTP server "listening" event.  */
  private onListening() {
    if (this.server2){
        var addr = this.server2.address();
        var bind = typeof addr === "string"
          ? "pipe " + addr
          : "port " + addr.port;
        console.log("Listening on " + bind);
    }
  };

  private newSocket  = (socket : any ) =>{
      var cookie_string = socket.request.headers.cookie;
      var parsed_cookies = require("cookie").parse(cookie_string);
      var connect_sid = parsed_cookies["connect.sid"];
      var sid = cookieParser.signedCookie(connect_sid, "SOMERANDOMSECRETHERE");
      this.socket = new SocketHand(socket, sid, jsondiffpatch, jsonfile);

  };

}

var myApp : App = new App();

// export = myApp;

