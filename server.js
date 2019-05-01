const express = require('express');
const app     = express();
const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const config  = require('./config');
const logger  = require('morgan');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');

var debugOut = ( config.debug ) ? console.log : (() => { });

(function () {
  debugOut('# Bot starting...');

  var controller = new (require('./imports/Controller'))({
    saveState: saveBotState,
    config: config
  });

  const scriptPath = __dirname + path.sep;

  function saveBotState(state) {
    fs.writeFile(scriptPath + 'state', JSON.stringify(state), (err) => {
      if (err) {
        throw err;
      }
      
      debugOut('# State has been saved');
    });
  }

  function loadBotState(callback) {
    fs.readFile(scriptPath + 'state', function (err, savedData) {
      if (err) {
        debugOut(err.code === 'ENOENT' ? '# No saved state file exists.' : err);
      } 
      else {
        const decodedSavedData = JSON.parse(savedData);      

        controller.setStateData(decodedSavedData);
      }

      callback();
    });
  }

  // https://www.notion.so/dd8bf6f5c1fd430286530644d4c362df
  var startWebhookServer = function() {
    app.set('port', process.env.PORT || 80);
    app.use(logger('dev'));
    app.use(bodyParser.json()); // parse received data as JSON
    app.use(methodOverride());

    app.post('/', function (req, res) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('thanks');
    
      controller.processWebhookData(req.body);
    });
    
    if ('development' == app.get('env')) {
      app.use(errorHandler());
    }
    
    var server = http.createServer(app);
    
    server.listen(app.get('port'), function () {
      debugOut(`# Webhook server listening on port ${app.get('port')}`);
    });
  }

  // Starts from here
  loadBotState(function () {
    startWebhookServer();
  });
})();