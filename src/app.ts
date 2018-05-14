import * as http from 'http';
import { DB } from './database/cached_storage';
import * as fs from 'fs';
import * as path from "path";
import { Route } from './route';

const cardIndex = new DB('cardIndex');
const priceHistory = new DB('priceHistory');
const accountIndex = new DB('accountIndex');

var includes = ['./dist/endpoints'];
var depthLimit = 4;

var req = async (file) => !file.endsWith('.js') ? "" : require(path.resolve(file));
const walkSync = async (d, p) => p<depthLimit? fs.statSync(d).isDirectory() ? fs.readdirSync(d).map(f => walkSync(path.join(d, f), p+1)) : req(d) : "";
includes.forEach(folder => walkSync(folder, 0) );

async function main() {
  var server = http.createServer((req, res) => {
    Route.registry.call(req.url, req, res, {cardIndex: cardIndex, priceHistory:priceHistory, accountIndex:accountIndex});
  });
  server.listen(80, () => {
    console.log("Listening on port");
  });
}
main();