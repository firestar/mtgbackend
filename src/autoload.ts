class Autoload{
  static ex;
  static loaded={};
  constructor(){
    if(!Autoload.ex) {
      Autoload.ex = new this.AutoloadClass();
    }
  }
  static get(name){
    return Autoload.loaded[name];
  }
  AutoloadClass = class AutoloadClass {
    load(name) {
      return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("class "+target.name+" loaded");
        if(name) {
          Autoload.loaded[name] = new target();
        }else {
          new target();
        }
      }
    }
  }
}
new Autoload()
exports.Autoload = Autoload;