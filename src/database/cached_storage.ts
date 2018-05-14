import * as LocalStorageClass from 'node-localstorage';
const LocalStorage = LocalStorageClass.LocalStorage;

class DB {
  localStorage = null;
  cache = {};
  saveDataQueue = {};
  constructor( private file: String ) {
    this.localStorage = new LocalStorage('./' + file);
    // saving handler, lets not spam the disk...
    setInterval(() => {
      var keys = Object.keys(this.saveDataQueue);
      for (let i = 0; i < keys.length; i++) {
        let data = this.saveDataQueue[keys[i]];
        this.localStorage.setItem(keys[i], JSON.stringify(data));
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
  get(key, func, time = 2/24) {
    const date = new Date();
    if (!this.isCacheValid(key)){
      const data = JSON.parse(this.localStorage.getItem(key));
      const date = new Date();
      date.setDate(date.getDate() + time);
      this.cache[key] = {data: data, date: date, hits: 0};
      func(data);
    } else {
      this.cache[key].hits++;
      func(this.cache[key].data);
    }
  }
}

export { DB }