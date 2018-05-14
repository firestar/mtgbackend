import { Route } from '../route';

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
}