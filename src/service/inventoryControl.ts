import {DB} from "../database/cached_storage";
var randomstring = require("randomstring");

class InventoryControl {

  db = null;
  sync = null;
  constructor(database: DB, sync: DB){
    this.db = database;
    this.sync = sync;
  }
  generateActionId(dataSync, func = aid=>{}){
    const actionId = randomstring.generate(15);
    if(!dataSync.index[actionId]) {
      return func(actionId);
    }
    this.generateActionId(dataSync, func);
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
          const newValue = obj[request.direction[0]] + request.direction[1];
          obj[request.direction[0]] = newValue;
          data.change();
          this.sync.get(user, (dataSync)=>{
            this.generateActionId(dataSync, aid=>{

              const idx = dataSync.actions.push({
                direction: request.direction,
                expected: request.expected,
                id: request.id,
                aid: aid
              });
              data['_sync_latest_idx'] = idx;
              dataSync.index[aid] = true;
              dataSync.change();

              rSO[request.id] = {
                "accept": true,
                "expected": request.expected,
                "result": obj[request.direction[0]],
                aid: aid
              };

              func();
            });
          });
        }else{
          rSO[request.id] = {"accept": false, "expected": request.expected, "result": (obj[request.direction[0]] + request.direction[1])};
          func();
        }
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
}

export {InventoryControl, InventoryRequestHandler}