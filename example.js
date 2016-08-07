'use strict';
const login = require('facebook-chat-api');
const fs = require('fs');
const prompt = require('prompt');
const Bot = require('./index.js');


function hello (botAPI) {
  botAPI.sendMessage('hi');
}

function eventLogger (botAPI, event) {
  botAPI.sendMessage(`That was the ${event.logMessageType} event type`);
}

function ping (botAPI) {
  botAPI.getUserByName(botAPI.args[0], (err, users) => {
    if (err) {
      botAPI.sendMessage(err);
    } else {
      botAPI.sendMessage(users.join('\n'));
    }
  });
}

function tdata (botAPI) {
  if (botAPI.args[0] === 'set') {
    botAPI.setThreadData(botAPI.args[1], botAPI.args[2], (err) => {
      if (err) {
        console.trace(err);
        return;
      }
    });
  } else if (botAPI.args[0] === 'view') {
    botAPI.getThreadData(botAPI.args[1], (err, val) => {
      if (err) {
        console.trace(err);
        return;
      }
      botAPI.sendMessage(val);
    });
  }
}

function udata (botAPI, event) {
  if (botAPI.args[0] === 'set') {
    console.log(event.senderID);
    botAPI.setUserData(event.senderID, botAPI.args[1], botAPI.args[2], (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  } else if (botAPI.args[0] === 'view') {
    botAPI.getUserData(event.senderID, botAPI.args[1], (err, val) => {
      if (err) {
        console.trace(err);
        return;
      }
      botAPI.sendMessage(val);
    });
  }
}

function authenticate(credentials){
  login(credentials, function(err, api) {
    if(err) return console.trace(err);

    if(credentials.email)
      fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));

    console.log('Logged in'); //we've authenticated

    const exampleBot = new Bot('examplebot', api);
    exampleBot
      .command('!hello', hello, '!hello')
      .command('!ping', ping, '!ping <name>')
      .command('!chatdata', tdata, `!chatdata set <key> <value>
        !chatdata view <key>`)
      .command('!userdata', udata, `!userdata set <key> <value>
        !userdata view <key>`)
      .event('event', eventLogger);
  });
}

try {
  authenticate({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))});
}
catch (err) {
  console.log('Enter your Facebook credentials - ' + 
  'your password will not be visible as you type it in');
  prompt.start();
  prompt.get([{
    name: 'email',
    required: true
  }, {
    name: 'password',
      hidden: true,//so we don't see the user's password when they type it in
      conform: function () {
        return true;
      }
    }], function (err, result) {
      authenticate(result); //pass credentials to authenticate function
    }
  );
}