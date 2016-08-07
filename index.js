'use strict';
const splitargs = require('string-argv');
const storage = require('node-persist');
const BotAPI = require('./BotAPI.js');

module.exports = class Bot {

  constructor(name, api) {
    this._name = name;
    this._api = api; // Keep reference to facebook-chat-api
    this._commands = new Map(); // Map of hooks
    this._events = new Map(); // Map of functions to run on events

    this.command.bind(this); // Add command
    this.event.bind(this); // Add event behavior
    this.listen.bind(this); // Start listening
    this._run.bind(this); // Run function associated with command / event
    this._cache.bind(this); // Cache list of users

    this.command('!help', this.help.bind(this), '!help'); // Add !help command

    storage.initSync();
    this.listen();
  }

  getName () {
    return this.name;
  }

  listen () {
    this._api.setOptions({
      logLevel: 'silent',
      selfListen: false,
      listenEvents: true
    });

    this._api.listen(function (err, event) {
      if(err)
        return console.trace(err);
      this._run(event.body, event);     
    }.bind(this));
  }

  command (name, func, usage, options) {
    this._commands.set(name, {
      'call': func,
      'usage': usage,
      'options': options
    });
    return this;
  }

  event (type, func) {
    if (!Array.isArray(type)) // Allow for arrays of events
      type = [type]; // If single event, convert to an array
    for (let event of type) {
      if (this._events.get(event)) 
        this._events.get(event).push(func);
      else
        this._events.set(event, [func]);
    }
    return this;
  }

  help (botAPI) {
    if (botAPI.args.length > 0) {
      if (this._commands.get(botAPI.args[0])) {
        botAPI.sendMessage(this._name + ' Help!' + 
          '\n\t' + this._commands.get(botAPI.args[0]).usage);
      }
    }
    else {
      let helpMessage = this._name + ' Help:';
      this._commands.forEach((val) => {
        helpMessage += '\n\t' + val.usage;
      });
      botAPI.sendMessage(helpMessage);
    }
  }

  _run (text, event) {
    if (this._events.get(event.type)) {
      this._events.get(event.type).forEach((func) => {
        func(this._api, event);
      });
    } 
    if (text == null || event.type !== 'message') {
      return;
    } else {
      console.log('Got a message from', event.senderID, ':', event.body);
      let args = splitargs(text);
      const scriptName = args[0];
      if (this._commands.get(scriptName)) {
        storage.getItem(event.threadID, (err, val) => {
          if (err) {
            console.trace(err);
            return;
          }
          let threadInfo = val;
          let botAPI = new BotAPI(text, event.threadID, this._api, threadInfo);
          this._commands.get(scriptName).call(botAPI, event, this._api);
        });
      }
    }
  }

  _cache (api, event) {
    if (event.type === 'event') 
      console.log(event.logMessageType);
  }


  // getUserByName(name, threadID, callback) {
  //   storage.getItem('users', (err, users) => {
  //     if (!users || !users[threadID]) {
  //       this.botAPI.api.getThreadInfo(threadID, (err, res) => {
  //         if(err)
  //           return console.trace(err);
  //         else {
  //           let pid = res.participantIDs;
  //           this.botAPI.api.getUserInfo(pid, (err, res) => {
  //             if(err)
  //               return console.trace(err);
  //             else {
  //               for (let id in res) {
  //                 let user = res[id];
  //                 user.id = id;
  //                 if(user.name.toLowerCase().indexOf(name.toLowerCase()) > -1) {
  //                   callback(null, res);
  //                 }
  //               } 
  //             }
  //             this.cacheUserList(threadID);
  //           });
  //         }
  //       }); 
  //     } else {
  //       const thread = users[threadID];
  //       let possible = [];
  //       for (var user in thread) {
  //         let match = thread[user].names.some((val) => {
  //           return val.toLowerCase().indexOf(name.toLowerCase()) > -1;
  //         });
  //         if (match) {
  //           let person = thread[user].account;
  //           person.id = user;
  //           possible.push(person);
  //         }
  //       }
  //       if (possible.length > 0)
  //         callback(null, possible);
  //       else 
  //         callback('No users found!', null);
  //     }
  //   });
    
  // }

  // fillUserInfo(threadID) {
  //   storage.getItem('users', (err, users) => {
  //     if (err)
  //       return console.trace(err);
  //     this.botAPI.api.getThreadInfo(threadID, (err, res) => {
  //       if (err)
  //         return console.trace(err);
  //       console.log('\tRetrieved Group Data');  
  //       res.participantIDs.forEach((val) => {
  //         storage.getItem('users', (err, users) => {
  //           if (!users[threadID][val]) {
  //             users[threadID][val] = {};
  //             users[threadID][val].names = new Set();
  //           }
  //           else {
  //             users[threadID][val].names = new Set(users[threadID][val].names);
  //           }
  //           if (res.nicknames[val]) {
  //             users[threadID][val].names.add(res.nicknames[val]);
  //           }

  //           this.botAPI.api.getUserInfo(val, (err, user) => {
  //             if (err)
  //               return console.trace(err);
  //             users[threadID][val].names.add(user[val].name);
  //             users[threadID][val].names = Array.from(users[threadID][val].names);
  //             users[threadID][val].account = user[val];
  //             storage.setItem('users', users);
  //             console.log('\t' + val + ' caching complete');
  //           }); 
  //         });
  //       });
  //     });
  //   });
  // }

  cacheUserList(threadID) {
    console.log('Caching Users');
    storage.getItem('users', (err, users) => {
      console.log('\tRetrieved Users Object');
      if (err)
        return console.trace(err);
      if (!users) {
        users = {};
        users[threadID] = {};
        storage.setItem('users', users);
      }
      this.fillUserInfo(threadID);
    });

  }


};



