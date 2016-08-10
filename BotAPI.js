'use strict';
const splitargs = require('string-argv');

module.exports = class BotAPI {
  constructor (event, threadID, api, threadInfo, storage) {
    this.args = (event.body) ? splitargs(event.body).slice(1) : null;
    this.threadID = threadID;

    this._storage = storage;
    this._api = api;
    this.thread = threadInfo;
    this._message = event;

    this.sendMessage.bind(this);
  }

  sendMessage (message) {
    this._api.sendMessage(message, this.threadID, (err) => {
      if (err) {
        return console.trace(err);
      }
    });
  }

  getUserByName (query) {
    let possible = [];
    for (let userID in this.thread.users) {
      let name = JSON.parse(this.thread.users[userID]).name;
      if (name.toLowerCase().includes(query.toLowerCase())) {
        let user = JSON.parse(this.thread.users[userID]);
        user.id = userID;
        possible.push(user);
      }
    }
    return possible;
  }

  getThreadData (key, callback) {
    this._storage.getItem(this.threadID + '-data-thread', (err, val) => {
      if (!val) {
        val = {};
        this._storage.setItem(this.threadID + '-data-thread', val);
      }
      if (!val[key])
        err = 'Key does not exist';
      return callback(err, val[key]);
    });
  }

  setThreadData (key, value, callback) {
    this._storage.getItem(this.threadID + '-data-thread', (err, val) => {
      val = val || {};
      val[key] = value;
      this._storage.setItem(this.threadID + '-data-thread', val, (err) => {
        return callback(err);
      });
    });
  }

  getUserData (userID, key, callback) {
    this._storage.getItem(this.threadID + '-data-user', (err, val) => {
      val = val || {};
      if (!val[userID])
        err = 'User does not exist';
      else if (!val[userID][key])
        err = 'Key does not exist';
      let result = null;
      if (!err) 
        result = val[userID][key];
    
      return callback(err, err ? null : val[userID][key]);
    });
  }

  setUserData (userID, key, value, callback) {
    console.log('called');
    this._storage.getItem(this.threadID + '-data-user', (err, val) => {
      console.log(val);
      val = val || {};
      console.log(val);
      val[userID] = val[userID] || {};
      val[userID][key] = value;
      this._storage.setItem(this.threadID + '-data-user', val, (err) => {
        return callback(err);
      });
    });
  }
};