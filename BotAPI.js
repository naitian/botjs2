'use strict';
const splitargs = require('string-argv');

module.exports = class BotAPI {
  constructor (event, threadID, api, threadInfo, storage) {
    this.args = (event.body) ? splitargs(event.body).slice(1) : null;
    this.threadID = threadID;

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

  getUserByName (query, callback) {
    let possible = [];
    // console.log(this.thread);
    for (let userID in this.thread.users) {
      // console.log(userID);
      let name = JSON.parse(this.thread.users[userID]).name;
      console.log(name);
      console.log(query);
      if (name.toLowerCase().includes(query.toLowerCase())) {
        possible.push(this.thread.users[userID]);
      }
    }
    if (possible.length < 1) {
      return callback('No users found', null);
    } else {
      return callback(null, possible);
    }
  }

  getThreadData (key, callback) {

  }

  setThreadData (key, value, callback) {

  }

  getUserData (userID, key, callback) {

  }

  setUserData (userID, key, value, callback) {

  }
};