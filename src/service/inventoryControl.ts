import {DB} from "../database/cached_storage";

class InventoryControl {

  db = null;
  constructor(database: DB){
    this.db = database;
  }

  handleRequest(user, request, func, rSO={}){
    const self = this;
    self.db.get(user, (data)=>{
      if (data !== null) {
        let obj = data;
        for ( let i=0; i < request.key.length; i++) {
          if(!obj[request.key[i]]){
            obj[request.key[i]]={};
          }
          obj = obj[request.key[i]];
        }
        if (!obj[request.direction[0]]) {
            obj[request.direction[0]]=0;
        }
        if(obj[request.direction[0]] + request.direction[1] === request.expected){
          rSO[request.id] = {"accept": true, "expected": request.expected, "result":(obj[request.direction[0]] + request.direction[1])};
        }else{
          rSO[request.id] = {"accept": false, "expected": request.expected, "result": (obj[request.direction[0]] + request.direction[1])};
        }
        func();
      } else {
          rSO[request.id] = {"accept": false, "expected": request.expected, "result": "error"};
          func();
      }
    })
  }
}

class InventoryRequestHandler{
  idx = -1;
  length = 0;
  request = null;
  constructor(request){
    this.request = request;
    this.length = this.request.length;
  }
  next(){
    if (this.idx+1 >= this.length) {
      return null;
    }
    this.idx ++;
    return this.request[this.idx];
  }
};

export {InventoryControl, InventoryRequestHandler}