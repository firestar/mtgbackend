import { Route } from '../route';
import * as crypt  from "crypto";
import * as randomstring  from "randomstring";

class Authentication {
  static memory = {
    session: {}
  };
  @Route.path.register("/authentication/register")
  registration(conn){
    const username = conn.client.data.username.toLowerCase();
    const password = conn.client.data.password;
    const hashedPassword = crypt.createHash('sha512').update(password).digest('hex');
    if (!username || !password || username.length<4 || password.length<4) {
      conn.client.send({status: 'error', message: 'please provide correct input', code: '100' });
      return;
    }
    conn.client.response.privateData.accountIndex.get(username, accData => {
      if (accData) {
        conn.client.send({status: 'error', message: 'account already exists', code: '109'});
      } else {
        conn.client.response.privateData.accountIndex.set(username, {password: hashedPassword}, account => {
          conn.client.send({status: 'success', account: username });
        });
      }
    });
  }
  @Route.path.register("/authentication/login")
  login(conn){
    const authorization = conn.client.req.headers.authorization;
    console.log(authorization);
    if (!authorization) {
      conn.client.send({status: 'error', message: 'account not found', code: '110'});
      return;
    }
    const data = Buffer.from(authorization.replace("Basic ",""), 'base64').toString().split(":");
    if(!data || data.length<2){
      conn.client.send({status: 'error', message: 'account not found', code: '111'});
      return;
    }
    const hashedPassword = crypt.createHash('sha512').update(data[1]).digest('hex');
    conn.client.response.privateData.accountIndex.get(data[0].toLowerCase(), accData => {
      if (accData && hashedPassword === accData.password) {
        const sessionKey = randomstring.generate(40);
        Authentication.memory.session[sessionKey] = {account: data[0].toLowerCase()};

        conn.client.send({status: 'success', session: sessionKey});
      } else {
        conn.client.send({status: 'error', message: 'account not found', code: '112'});
      }
    });
  }
  @Route.path.register(['/cards', '/auth'], false)
  authentication(conn) {
    const sessionKey = conn.client.req.headers.session;
    if (!sessionKey || sessionKey.length < 2) {
      conn.client.send({status: 'error', message: 'account not found', code: '130'});
      conn.complete();
      return;
    }
    if (Authentication.memory.session[sessionKey]) {
      conn.client.response.privateData.accountIndex.get(Authentication.memory.session[sessionKey].account, accData => {
        if (accData) {
          conn.proceed({account: Authentication.memory.session[sessionKey].account});
        } else {
          conn.client.send({status: 'error', message: 'account not found', code: '139'});
          conn.complete();
        }
      });
    } else {
      conn.client.send({status: 'error', message: 'account not found', code: '131'});
      conn.complete();
    }
  }
  @Route.path.register("/auth/logout")
  logout(conn) {
    const sessionKey = conn.client.req.headers.session;
    if (!sessionKey || sessionKey.length < 2) {
      conn.client.send({status: 'error', message: 'account not found', code: '120'});
      conn.complete();
      return;
    }
    if (Authentication.memory.session[sessionKey]) {
      conn.client.response.privateData.accountIndex.get(Authentication.memory.session[sessionKey].account, accData => {
        if (accData) {
          delete Authentication.memory.session[sessionKey];
          conn.client.send({status: 'success'});
          conn.complete();
        } else {
          conn.client.send({status: 'error', message: 'account not found', code: '129'});
          conn.complete();
        }
      });
    } else {
      conn.client.send({status: 'error', message: 'account not found', code: '121'});
      conn.complete();
    }
  }
  @Route.path.register('/auth/loggedin')
  loggedin(conn) {
    const sessionKey = conn.client.req.headers.session;
    if (!sessionKey || sessionKey.length < 2) {
      conn.client.send({status: 'error', message: 'account not found', code: '130'});
      conn.complete();
      return;
    }
    if (Authentication.memory.session[sessionKey]) {
      conn.client.response.privateData.accountIndex.get(Authentication.memory.session[sessionKey].account, accData => {
        if (accData) {
          conn.client.send({status:'success', account: Authentication.memory.session[sessionKey].account});
        } else {
          conn.client.send({status: 'error', message: 'account not found', code: '139'});
          conn.complete();
        }
      });
    } else {
      conn.client.send({status: 'error', message: 'account not found', code: '131'});
      conn.complete();
    }
  }
}
exports.Authentication = Authentication;