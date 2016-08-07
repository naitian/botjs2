'use strict';
const splitargs = require('string-argv');

module.exports = class BotAPI {
  constructor (message, threadID, api, threadInfo) {
    this.args = splitargs(message.body).slice(1);
    this.threadID = threadID;

    this._api = api;
    this._thread = threadInfo;
    this._message = message;

    this.sendMessage.bind(this);
  }

  sendMessage (message) {
    this._api.sendMessage(message, this.threadID, (err) => {
      if (err) {
        return console.trace(err);
      }
    });
  }

  getUserByName (name, callback) {
    let possible = [];
    for (let userID in this._thread.users) {
      if (this._thread.users[userID].names.includes(name.toLowerCase())) {
        possible.push(this._thread.users[userID]);
      }
    }
    if (possible.length < 1) {
      return callback('No users found', null);
    } else {
      return callback(null, possible);
    }
  }
};