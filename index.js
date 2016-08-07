'use strict';
const splitargs = require('string-argv');
const storage = require('node-persist');
const BotAPI = require('./BotAPI.js');
const async = require('async');

module.exports = class Bot {

  constructor(name, api) {
    this._name = name;
    this._api = api; // Keep reference to facebook-chat-api
    this._commands = new Map(); // Map of hooks
    this._events = new Map(); // Map of functions to run on events
    this._cachingThreads = new Set();
    this._postponedCalls = new Map();

    this.command.bind(this); // Add command
    this.event.bind(this); // Add event behavior
    this.listen.bind(this); // Start listening
    this._run.bind(this); // Run function associated with command / event
    this._cache.bind(this); // Cache list of users

    this.command('!help', this.help.bind(this), '!help'); // Add !help command
    this.event('event', this._cache.bind(this)); // Add !help command

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
     if (this._cachingThreads.has(event.threadID)) {
       if (this._postponedCalls.get(event.threadID))
        this._postponedCalls.get(event.threadID).push(function(){
          this._run(text, event);
        });
      else {
        this._postponedCalls.set(event.threadID, [function(){
          this._run(text, event);}]);
      }
      return;
    }
    if (this._events.get(event.type)) {
      storage.getItem(event.threadID, (err, val) => {
        if (err) {
          console.stacktrace(err);
          return;
        }
        let threadInfo = val;
        let botAPI = new BotAPI(event, event.threadID, this._api, threadInfo);
        this._events.get(event.type).forEach((func) => {
          func(botAPI, event);
        });
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
          let botAPI = new BotAPI(event, event.threadID, this._api, threadInfo);
          this._commands.get(scriptName).call(botAPI, event, this._api);
        });
      }
    }
  }

  _cache (botAPI, event) {
    let groupChange = false;

    if (event.type === 'event')
      groupChange = (event.logMessageType === 'log:unsubscribe' || // Person leaves Group
          event.logMessageType === 'log:subscribe' || // Person joins Group
          event.logMessageBody.indexOf('nickname') > -1); // Changes nickname

    if (groupChange) {
      console.log('Began Caching');
      this._cachingThreads.add(botAPI.threadID);
      storage.setItem(botAPI.threadID, {}, (err) => {
        if (err) {
          console.trace(err);
          return;
        }
        this._api.getThreadInfo(botAPI.threadID, (err, info) => {
          if (err) {
            console.trace(err);
            return;
          } else {
            this._api.getUserInfo(info.participantIDs, (err, users) => {
              if (err) {
                console.trace(err);
                return;
              }
              async.eachOf(users, (value, key, callback) => {
                storage.getItem(botAPI.threadID, (err, val) => {
                  if (err) {
                    callback(err);
                    return;
                  }
                  val = val || {}; // If the Thread object doens't exist yet.
                  val.users = val.users || {}; // If the participant exists, else new object
                  val.users[key] = JSON.stringify(value);

                  storage.setItem(botAPI.threadID, val, (err) => {
                    if (err) {
                      callback(err);
                      return;
                    }
                    callback();
                  });
                });
              }, (err) => {
                if (err) {
                  console.trace(err);
                  return;
                }
                console.log('Finished caching');
                this._cachingThreads.delete(botAPI.threadID);
                console.log(this._postponedCalls.get(botAPI.threadID));
                for (let func of this._postponedCalls.get(botAPI.threadID)) {
                  console.log(func);
                  func();
                }
                return;
              });
            });
          }
        });
      });
    } 
  }
};



