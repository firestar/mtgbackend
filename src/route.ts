import * as process from "process";
import * as async from "async";


import { Autoload } from './autoload';

class RegisterDecoratorClass {
  register(data: any, end) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if(target) {
        console.log("path "+JSON.stringify(data) +" => "+target.constructor.name+"."+propertyKey);
        Route.registry.add(data, descriptor.value, end);
      }
    }
  }
}


class RouteRegistryClass{
  root;
  notfound;
  constructor() {
    this.root = new PathElement("/");
    this.notfound = function (req, res) {
      //res.writeHead(404, {"Content-Type": "text/plain"});
      res.end("{}");
    }
  }

  add(full_path, link_method) {
    var self = this;
    if (full_path instanceof Array) {
      var len = full_path.length;
      for (var i = 0; i < len; i++) {
        this.add(full_path[i], link_method);
      }
      return;
    }
    var path_parts = full_path.split("/");
    path_parts = path_parts.slice(1, path_parts.length);
    var currentPath: PathElement = this.root;
    var matches = {};
    if (path_parts[0] != '') {
      path_parts.forEach((path_string, index) => {
        var match = null;
        var regex;
        if (/:\w+/i.test(path_string)) {
          var i = path_string.lastIndexOf(":");
          regex = path_string.slice(0, i);
          match = path_string.slice(i + 1);
          matches[index] = {regex: regex, match: match};
          path_string = "*";
        }
        if (!currentPath.paths[path_string]) {
          currentPath.paths[path_string] = new PathElement(path_string);
        }
        currentPath = currentPath.paths[path_string];
      });
    }
    currentPath.addFunction(link_method, matches, full_path);
  }

  async call(full_path: string, req, res, data = {}) {
    var self = this;
    var jsonString = '';
    req.on('data', function (data) {
      jsonString += data;
    });
    req.on('end', function () {
      var pageData = "";
      try {
        pageData = JSON.parse(jsonString);
      } catch (err) {
        console.log(JSON.stringify(err));
      }
      var execution_info = {
        "/": {
          functions: new Array(),
          "/": {}
        },
        method: req.method,
        data: pageData,
        request: full_path,
        from: req.connection.remoteAddress,
        query: {},
        time: {
          start: process.hrtime()[1],
          end: 0,
          total: 0
        }
      };
      var path_query = full_path.split("?");
      var path_parts = path_query[0].split("/");
      var query = {};
      if (path_query.length > 1) {
        var query_parts = path_query[1].split("&");
        query_parts.forEach((query_param) => {
          var param = query_param.split("=");
          if (param.length == 2) {
            query[param[0]] = param[1];
          }
        });
      }
      execution_info.query = query;
      var response: ResponseData = new ResponseData(data);
      path_parts = path_parts.slice(1, path_parts.length);
      var currentPath: PathElement = self.root;
      var client = new Client(path_parts, req, res, response, query, req.method, pageData, execution_info);
      async.parallel(
        [
          () => {
            currentPath.call(client, -1, execution_info["/"]);
          },
          () => {
            setTimeout(() => {
              if (!client.wait) {
                if (res) {
                  //res.writeHead(404, {"Content-Type": "text/plain"});
                  res.end(JSON.stringify({
                    'status': "not found"
                  }));
                }
              }
            }, 300);
          }
        ]
      );
    });
  }
}


class CurrentExecution{
  client;
  path_level;
  currentLevel;
  function_execute=null;
  uri;
  func;
  log;
  constructor(client, path_level, currentLevel, func, log){
    this.client = client;
    this.path_level = path_level;
    this.currentLevel = currentLevel;
    this.func = func;
    this.log = log;
  }
  exec(){
    if(this.func==null){
      this.proceed();
      return;
    }
    this.function_execute = {
      name: this.client.paths[this.path_level],
      index: this.path_level,
      path: this.func.path,
      private_variables: this.client.response.pr(),
      public_variables: this.client.response.pu(),
      time:{
        start: process.hrtime()[1],
        end: 0,
        total: 0
      },
      executed: false,
      proceed: false
    };
    var keys = Object.keys(this.func.matches);
    this.uri = {};
    keys.forEach((key)=>{
      this.uri[this.func.matches[key].match] = this.client.paths[key];
    });
    this.function_execute.variables = this.uri;
    if(true) { // check added here later
      this.function_execute.executed = true;
      this.func.method(this);
    }else{
      // conditional based on regex matching
      //this.proceed();
    }
  }
  saveFunctionLog(proceed){
    if(this.function_execute!=null) {
      this.function_execute.time.end = process.hrtime()[1];
      this.function_execute.time.total = this.function_execute.time.end - this.function_execute.time.start;
      this.function_execute.proceed = proceed;
      this.log.functions.push(this.function_execute);
    }
  }
  wait(){
    this.client.wait=true;
  }
  proceed(data = {}){
    this.saveFunctionLog(true);
    if(this.func==null){ // end traversal
      return;
    }
    Object.keys(data).forEach( i=> {
      this.client[i] = data[i];
    });
    if(this.func.next){
      new CurrentExecution(this.client, this.path_level, this.currentLevel, this.func.next, this.log).exec();
    }else{
      this.currentLevel.escalate(this.client, this.path_level, this.log);
    }
  }
  complete(){
    this.saveFunctionLog(false);
    this.client.execution_info.time.end=process.hrtime()[1];
    this.client.execution_info.time.total = this.client.execution_info.time.end-this.client.execution_info.time.start;
  }
}

class PathElement {
  paths;
  path:string;
  rootFunction=null;
  constructor(path:string){
    this.path = path;
    this.paths = {};
  }
  addFunction(method, matches, path){
    if(this.rootFunction){
      this.rootFunction.add(new FunctionExecution(method, matches, path));
    }else{
      this.rootFunction=new FunctionExecution(method, matches, path);
    }
  }
  call(client, path_level, log){
    if(this.rootFunction==null){
      this.escalate(client, path_level, log);
    }
    new CurrentExecution(client, path_level, this, this.rootFunction, log).exec();
  }
  escalate(client, path_level, log){
    ++path_level;
    async.parallel(
      [
        ()=> {
          if (this.paths[client.paths[path_level]]) {
            log["/"][client.paths[path_level]]={
              functions: new Array(),
              "/":{}
            };
            this.paths[client.paths[path_level]].call(client, path_level, log["/"][client.paths[path_level]]);
          }
        },
        ()=> {
          if (this.paths["*"]) {
            log["/"]["*"]={
              functions: new Array(),
              "/":{}
            };
            this.paths["*"].call(client, path_level, log["/"]["*"]);
            //  return false;
            //}
          }
        }
      ]
    );
  }
}


class Client{
  paths;
  req;
  res;
  data;
  method;
  response;
  wait;
  query;
  execution_info;
  send (obj) {
    this.res.setHeader('Access-Control-Allow-Origin', '*');
    this.res.setHeader('Access-Control-Request-Method', '*');
    this.res.setHeader('Access-Control-Allow-Methods', '*');
    this.res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, session');
    //console.log(typeof obj);
    switch(typeof obj){
      case 'object':
        try {
          this.res.end(JSON.stringify(obj));
        }catch(e){
          this.send({status: 'error'});
          console.log(e);
        }
        break;
      case 'boolean':
      case 'number':
      case 'string':
        this.res.end(obj);
        break;
    }
  }
  constructor(paths, req, res, response, query, method, data, execution_info){
    this.data=data;
    this.paths=paths;
    this.method=method;
    this.wait=false;
    this.req=req;
    this.res=res;
    this.response=response;
    this.query=query;
    this.execution_info=execution_info;
  }
}


class ResponseData {
  publicData;
  privateData;
  constructor(initialData){
    this.publicData = {};
    this.privateData = {};
    this.privateData = Object.assign(this.privateData, initialData);
  }
  public(data){
    this.publicData = Object.assign(this.publicData,data);
  }
  private(data){
    this.privateData = Object.assign(this.privateData,data);
  }
  pu(){
    return this.publicData;
  }
  pr(){
    return this.privateData;
  }
  publicJSON(){
    return JSON.stringify(this.publicData);
  }
}

class FunctionExecution{
  next=null;
  method=null;
  matches=null;
  path=null;
  constructor(method, matches, path){
    this.method=method;
    this.matches=matches;
    this.path=path;
  }
  add(func:FunctionExecution){
    if(this.next){
      this.next.add(func);
    }else {
      this.next=func;
    }
  }
}

@Autoload.ex.load("route")
class Route{
  static path;
  static registry;
  constructor(){
    if(!Route.path) {
      Route.path = new RegisterDecoratorClass();
    }
    if(!Route.registry) {
      Route.registry = new RouteRegistryClass();
    }
  }
}

export { Route, ResponseData, PathElement, Client };