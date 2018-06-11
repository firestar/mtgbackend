import * as LocalStorageClass from 'node-localstorage';
const LocalStorage = LocalStorageClass.LocalStorage;

class DB {
  localStorage = null;
  cache = {};
  hashKey = "";
  saveDataQueue = {};
  constructor( private file: String ) {
    this.localStorage = new LocalStorage('./' + file);
    // saving handler, lets not spam the disk...
    setInterval(() => {
      var keys = Object.keys(this.saveDataQueue);
      for (let i = 0; i < keys.length; i++) {
        let data = this.saveDataQueue[keys[i]];
        this.localStorage.setItem(keys[i], JSON.stringify(data));
        console.log("saved",keys[i]);
        delete this.saveDataQueue[keys[i]];
      }
    }, 10000);
  }
  set(key, value, func, time = 2/24) {
    const date = new Date();
    date.setDate(date.getDate() + time);
    this.saveDataQueue[key] = value;
    this.cache[key] = {data: value, date: date, hits: 0};
    func(value);
  }
  isCacheValid(key) {
    if (this.cache[key]){
      if (new Date(this.cache[key].date) > new Date()) {
        return true;
      }
    }
    return false;
  }
  delete(key, func = ()=>{}){
    delete this.saveDataQueue[key];
    delete this.cache[key];
    this.localStorage.delete(key);
    func();
  }
  get(key, func, time = 2/24) {
    const date = new Date();
    if (!this.isCacheValid(key)){
      const storedData = this.localStorage.getItem(key);
      if (!storedData) {
        func(null);
        return;
      }
      const date = new Date();
      date.setDate(date.getDate() + time);
      var data = JSON.parse(storedData);
      const dataWrap = {data: data, date: date, changes: 0};
      data.change = ()=>{
        this.saveDataQueue[key] = data;
      };
      this.cache[key] = dataWrap;
      func(this.cache[key].data);
    } else {
      func(this.cache[key].data);
    }
  }
}

export { DB }