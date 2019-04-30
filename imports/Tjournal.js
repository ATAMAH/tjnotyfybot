'use strict';

module.exports = Tjournal;

const querystring = require('querystring');                                                                                                                                                                                                
const https = require('https');

function Tjournal(parameters) {
  this.parameters = parameters;

  this.state = {};
}

Tjournal.prototype.getStateData = function() {
	return this.state;
};

Tjournal.prototype.setStateData = function(input) {
	this.state = input;
};

Tjournal.prototype.initWebhook = function(callback) {
  var postData = querystring.stringify({
    'url'  :  this.parameters.config.url,
    'event': 'new_comment'
  });

  var options = {
    hostname: 'api.tjournal.ru',
    port: 443,
    path: '/v1.6/webhooks/add',
    method: 'POST',
    headers: {
      'Content-Type'  : 'application/x-www-form-urlencoded',
      'X-Device-Token':  this.parameters.config.token,
      'Content-Length':  postData.length
    }
  };
  
  var req = https.request(options, (res) => {
    if (res.statusCode == 200) {
      // Webhook init OK
      callback(true);
    }
    else {
      // Webhook init fault
      callback(false);
    }
  
    let rawData = '';

    res.on('data', (chunk) => { rawData += chunk; });

    res.on('end', () => {
      try {
        //const parsedData = JSON.parse(rawData);
      } 
      catch (e) {

      }
    });
  });
  
  req.on('error', (e) => {
    // Webhook init error
    callback(false);
  });
  
  req.write(postData);
  req.end();
}