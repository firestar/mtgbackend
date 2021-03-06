import * as http from 'http';
import { DB } from './database/cached_storage';
import * as fs from 'fs';
import * as path from "path";
import { Route } from './route';
import { InventoryControl } from "./service/inventoryControl";

const cardIndex = new DB('cardIndex');
const priceHistory = new DB('priceHistory');
const sessions = new DB('sessions');
const sync = new DB('syncData');
const accountIndex = new DB('accountIndex');

const cardInventory = new InventoryControl(cardIndex, sync);

var includes = ['./dist/endpoints'];
var depthLimit = 4;

var req = async (file) => !file.endsWith('.js') ? "" : require(path.resolve(file));
const walkSync = async (d, p) => p<depthLimit? fs.statSync(d).isDirectory() ? fs.readdirSync(d).map(f => walkSync(path.join(d, f), p+1)) : req(d) : "";
includes.forEach(folder => walkSync(folder, 0) );

async function main() {
  var server = http.createServer((req, res) => {
    Route.registry.call(req.url, req, res, {cardIndex: cardIndex, priceHistory:priceHistory, sessions:sessions, accountIndex:accountIndex, sync:sync, cardInventory:cardInventory});
  });
  server.listen(80, () => {
    console.log("Listening on port 80");
  });
}
main();