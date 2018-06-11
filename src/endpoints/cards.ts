import { Route } from '../route';
import {InventoryRequestHandler} from "../service/inventoryControl";

class Cards{
  @Route.path.register("/cards/all")
  cardList(conn){
    conn.client.response.privateData.cardIndex.get(conn.client.account, data => {
      conn.client.send({status: 'success', data: data});
    });
  }
  @Route.path.register("/cards/save")
  cardSave(conn){
    if (!conn.client.data) {
      conn.client.send({status: 'error', message: 'card data is blank'});
      conn.complete();
    }
    conn.client.response.privateData.cardIndex.set(conn.client.account, conn.client.data, data => {
      conn.client.send({status: 'success', data: data});
    });
  }
  @Route.path.register("/cards/sync")
  cardSyncRequest(conn) {
    if (!conn.client.data) {
      conn.client.send({status: 'error', message: 'collection sync request empty'});
      conn.complete();
      return;
    }
    if(conn.client.data.idx){
      const idx = conn.client.data.idx;
      conn.client.response.privateData.sync.get(conn.client.account, data=>{
        const lastIDX = data.actions.length;
        conn.client.send({status: 'success', sync: data.actions.slice(idx, lastIDX), idx: lastIDX});
        conn.complete();
        return;
      });
    }else{
      conn.client.send({status: 'error', message: 'idx must be specified'});
      conn.complete();
      return;
    }
  }
  @Route.path.register("/cards/change")
  cardChangeRequest(conn){
    if (!conn.client.data) {
      conn.client.send({status: 'error', message: 'card change request empty'});
      conn.complete();
    }
    const handler = new InventoryRequestHandler(conn.client.data.data);
    const requestStatusObject = {};
    const callNext = () => {
      let request=null;
      if ((request = handler.next()) === null) {
        conn.client.send({status: 'success', rso: requestStatusObject});
        conn.complete();
        return;
      }
      conn.client.response.privateData.cardInventory.handleRequest(conn.client.account, request, callNext, requestStatusObject);
    }
    callNext();
    conn.wait();
    /*conn.client.response.privateData.cardIndex.set(conn.client.account, conn.client.data, data => {
      conn.client.send({status: 'success', data: data});
    });*/
  }
}