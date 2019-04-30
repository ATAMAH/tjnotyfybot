# TJournal - Telegram bot example

Simple node.js bot that can work with telegram by SOCKS proxy and subscribes to TJournal webhooks at each start.

Bot saves its state to *state* file in server root and loads it at each start.

Working bot described here: https://tjournal.ru/flood/94920-bot-dlya-upominaniy-v-kommentariyah

### Bot commands
**/start** and **/track** that shows bot info

**/track** *text* or **/track** and *text* in separate messages adds subscription to *text*

**/remove** *text* or **/remove** and *text* in separate messages removes subscription to *text*

**/list** shows your subscriptions

**/top** shows list of top subscriptions for all users

### And some commands for admins
**/users** shows list of all bot subscribers

**/subs** lists of all subscription texts of all users without usernames

### Admin notifications
Bot can notify admins about new subscriptions, subscribers and other events.

### Configuration
Just change values in config.js file and it will work:
```javascript
const config = {
  // Enable console debug messages?
  debug: true,
  telegram: {
    // Send debug messages to admin telegram chat?
    debug: true,
    // Send messages to administrators about new subscriptions, subscribers etc
    notifyAdmin: true,
    // Create bot with @BotFather and paste bot token here
    token: 'YOUR_TELEGRAM_BOT_TOKEN_HERE',
    // Username of bot admin (or admins) for bot control
    // without @ symbol
    // You need to start a chat with bot to make it work
    admin: ['YOUR_TELEGRAM_USERNAME'],
    // Bot description that shows when you send /start or /help to your bot
    info: "Change this text in config.js",
    // text that wiil be sent if bot haven't this command
    unknownCmd: "Unknown command. Use /help to show all commands.",
    // Use a SOCKS proxy?
    useProxy: false,
    socksHost: '0.0.0.0',
    socksPort: 8080,
    socksUsername: 'login',
    socksPassword: 'password'
  },
  tjournal: {
    // Paste your tjournal.ru API-token here
    // How to get the token https://tjournal.ru/team/92194-konkurs-dlya-razrabotchikov-ot-tj-i-geekbrains
    token: 'YOUR_TJOURNAL_TOKEN_HERE',
    // URL to your server
    url: 'https://somedomain.somezone'
  }
}
```
