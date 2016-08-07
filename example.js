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