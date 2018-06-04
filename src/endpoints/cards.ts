import { Route } from '../route';
import {InventoryRequestHandler} from "../service/inventoryControl";

class Cards{
  @Route.path.register("/cards/list")
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

  @Route.path.register("/cards/change")
  cardChangeRequest(conn){
    if (!conn.client.data) {
      conn.client.send({status: 'error', message: 'card change request empty'});
      conn.complete();
    }
    const handler = new InventoryRequestHandler(conn.client.data.data);
    const requestStatusObject = {};
    const callNext = () => {
      const request = handler.next();
      if (request === null) {
        conn.client.send({status: 'success', rso: requestStatusObject});
        conn.complete();
        return;
      }
      conn.client.response.privateData.cardInventory.handleRequest("firestar", request, callNext, requestStatusObject);
    }
    callNext();
    conn.wait();
    /*conn.client.response.privateData.cardIndex.set(conn.client.account, conn.client.data, data => {
      conn.client.send({status: 'success', data: data});
    });*/
  }
}