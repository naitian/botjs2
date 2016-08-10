# botjs2
A framework for writing Facebook messenger chat bots (based on [facebook-chat-api](https://github.com/Schmavery/facebook-chat-api/)). 
## Documentation
### Table of Contents

### Quickstart (see example.js)
1. Install `botjs2` using `npm install --save https://github.com/naitian/botjs2`
2. Authenticate using the facebook-chat-api. Upon a successful login, instantiate a `Bot`:
    - `const exampleBot = new Bot('examplebot', api);`
    - The first argument in the constructor is the bot name. The second argument is the api object received in the callback upon successful login.
3. Register commands for the bot using:
    - `exampleBot.command('!hello', hello, '!hello')`
    - The first argument is the command name
    - The second argument is the function to be called
    - The third argument is the usage (used in automatically generating the help menu)
4. Register event hooks for the bot using:
    - `exampleBot.event('typ', typing)`
    - The first argument is the event type.
    - The second arg is the function to be called.

### Introduction
This framework was designed to make creating Facebook messenger chat bots easier. This is an opinionated framework, and it isn't for everyone.
#### Commands
The basis of this framework is the bot responds to commmands. A function is defined to be run when the command is called.
##### Format
All commands are of the format: 

    !command <args...>

where `command` is the command name and `<args>` are arguments parsed using the [`string-argv`](https://www.npmjs.com/package/string-argv) package. All calls for commands begin with an exclamation mark.
##### Possible Examples for Commands (from example.js)
- No argument command: `!hello`
- Single argument command: `!ping <name>`
- Sub-command: `!chatdata view <key>`
- Sub-command with multiple arguments: `!chatdata set <key> <value>`

#### Events
Functions can also be run on events. See the [facebook-chat-api docs](https://github.com/Schmavery/facebook-chat-api/blob/master/DOCS.md#listen) for all of the types of events that can be handled.

