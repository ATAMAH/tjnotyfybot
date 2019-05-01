'use strict';

module.exports = Controller;

require('./utils')();

function Controller(parameters) {
  this.parameters = parameters;

  this.state = { 
    subscribes: {},
    subscribers: {},
    adminChats: {}
  };

  this.telegram = new (require('./Telegram'))({
    config: this.parameters.config.telegram
  });

  this.telegram.bot.on('message', (msg) => {
    let data = this.telegram.parseData(msg);

    this.processTelegramData(data);
  });

  this.telegram.bot.on('polling_error', (error) => {
    this.notifyAdmin(`# Bot polling error ${JSON.stringify(error)}\n#stat #error`);
  });

  // Definition for commands functions
  this.commands = {
    // commands for all users
    start: function(data, controller) {
      if (!data.cmd.pending) {
        controller.telegram.sendDescription(data.chatId);
      }
    },
    help: function(data, controller) {
      if (!data.cmd.pending) {
        controller.telegram.sendDescription(data.chatId);
      }
    },
    track: function(data, controller) {
      if (data.cmd.arg) {
        let term = data.cmd.arg;
    
        controller.addSubscription(term, data.chatId);
        controller.addSubscriber(data.username, data.chatId);

        controller.notifyAdmin(`# Пользователь @${data.username} подписался на упоминание «${term}»\n#stat #${data.cmd.cmd}`);
      }
      else {
        controller.telegram.sendMessage(data.chatId, `Пришлите текст для отслеживания`, { reply_markup: { remove_keyboard: true }});
      }
    },
    remove: function(data, controller) {
      if (data.cmd.arg) {
        let term = data.cmd.arg;
    
        controller.removeSubscription(term, data.chatId);

        controller.notifyAdmin(`# Пользователь @${data.username} отписался от упоминаний «${term}»\n#stat #${data.cmd.cmd}`);
      }
      else {
        let terms = [];
      
        Object.keys(controller.state.subscribes).forEach(function(key){
          if (controller.state.subscribes[key][data.chatId]) {
            terms.push(key);
          }
        });

        let opts = {
          reply_markup: JSON.stringify({
            keyboard: terms.slice(0,12).chunk(3),
            resize_keyboard: true,
            one_time_keyboard: true
          })
        };

        controller.telegram.sendMessage(data.chatId, `Пришлите текст для отмены отслеживания`, opts);
      }
    },
    list: function(data, controller) {
      let terms = [];

      Object.keys(controller.state.subscribes).forEach(function(key){
        if (controller.state.subscribes[key][data.chatId]) {
          terms.push(key);
        }
      });
    
      controller.telegram.sendMessage(data.chatId, `Ваши подписки (${terms.length}):\n${terms.join(', ').escapeMarkdown()}\n\nДля удаления подписки используйте /remove *текст*\n#stat #${data.cmd.cmd}`, 
                                      { reply_markup: { remove_keyboard: true }, 
                                        parse_mode: "Markdown", 
                                        disable_web_page_preview: true});
    },
    top: function(data, controller) {
      let termsCount = {};
  
      Object.keys(controller.state.subscribes).forEach(function(key){
        termsCount[key] = Object.keys(controller.state.subscribes[key]).length;
      });
  
      let termsSorted = Object.keys(termsCount).sort(function(b,a){return termsCount[a]-termsCount[b]}).slice(0,10);
  
      controller.telegram.sendMessage(data.chatId, `Топ 10 подписок:\n${termsSorted.join(', ')}\n#stat #${data.cmd.cmd}`, 
        { parse_mode: "Markdown", 
          disable_web_page_preview: true });
    },
    // commands for admins
    users: function(data, controller) {
      if (!data.isAdmin) {
        return;
      }

      let subscribers = Object.keys(controller.state.subscribers);
    
      controller.telegram.sendMessage(data.chatId, `Подписчики бота (${subscribers.length}):\n@${subscribers.join(', @').escapeMarkdown()}\n#stat #${data.cmd.cmd}`, 
        { parse_mode: "Markdown", 
          disable_web_page_preview: true });
    },
    subs: function(data, controller) {
      if (!data.isAdmin) {
        return;
      }

      let subscribes = Object.keys(controller.state.subscribes);

      controller.telegram.sendMessage(data.chatId, `Подписки (${subscribes.length}):\n${subscribes.join(', ').escapeMarkdown()}\n#stat #${data.cmd.cmd}`, 
        { parse_mode: "Markdown", 
          disable_web_page_preview: true });
    },
    preview: function(data, controller) {
      if (!data.isAdmin) {
        return;
      }

      if (data.cmd.arg) {
        controller.telegram.sendMessage(data.chatId, `${data.cmd.argRaw}\n#stat #${data.cmd.cmd}`, 
          { parse_mode: "Markdown", 
            disable_web_page_preview: true });
      }
      else {
        controller.telegram.sendMessage(data.chatId, `Пришлите текст для предпросмотра\n#stat #${data.cmd.cmd}`, 
          { parse_mode: "Markdown", 
            disable_web_page_preview: true });
      }
    },
    notify: function(data, controller) {
      if (!data.isAdmin) {
        return;
      }

      Object.keys(controller.state.subscribers).forEach(function(username) {
        let chatId = controller.state.subscribers[username];

        controller.telegram.sendMessage(chatId, `${data.cmd.argRaw}\n#stat #${data.cmd.cmd}`, 
        { parse_mode: "Markdown", 
          disable_web_page_preview: true });
      });          
    },
    state: function(data, controller) {
      if (!data.isAdmin) {
        return;
      }

      let buf = Buffer.from(JSON.stringify(controller.getStateData()));

      controller.telegram.bot.sendDocument(data.chatId, buf, {}, { filename: 'state', contentType: 'text/plain' }); 
      controller.telegram.sendMessage(data.chatId, `#stat #${data.cmd.cmd}`); 
    }
  };

  this.tjournal = new (require('./Tjournal'))({
    config: this.parameters.config.tjournal
  });

  this.tjournal.initWebhook(function(res) {
    if (!res) {
      // Webhook init error
    }
    else {
      // Webhook init OK
    }
  });
}

Controller.prototype.addSubscription = function(term, chatId) {
  if (!this.state.subscribes[term]) {
    this.state.subscribes[term] = {};
  }

  if (!this.state.subscribes[term][chatId]) {
    this.telegram.sendMessage(chatId, `Вам будут приходить уведомления об упоминании «${term}» в комментариях\n#stat #track`, { reply_markup: { remove_keyboard: true }});

    this.state.subscribes[term][chatId] = 1;

    this.parameters.saveState(this.getStateData());

    return;
  }

  this.telegram.sendMessage(chatId, `Вы уже подписаны на упоминания «${term}» в комментариях`, { reply_markup: { remove_keyboard: true }});
}

Controller.prototype.removeSubscription = function(term, chatId) {
  if (this.state.subscribes[term]) {
    if (this.state.subscribes[term][chatId]) {
      delete this.state.subscribes[term][chatId];

      if (!Object.keys(this.state.subscribes[term]).length) {
        delete this.state.subscribes[term];
      }

      this.telegram.sendMessage(chatId, `Вы отписались от уведомлений об упоминании «${term}» в комментариях\n#stat #remove`, { reply_markup: { remove_keyboard: true }});
      this.parameters.saveState(this.getStateData());

      return;
    }
  }

  this.telegram.sendMessage(chatId, `Вы не были подписаны на упоминания «${term}» в комментариях`, { reply_markup: { remove_keyboard: true }});
}

Controller.prototype.addSubscriber = function(username, chatId) {
  if (!this.state.subscribers[username]) {
    this.notifyAdmin(`# Новый подписчик @${username}\n#stat #subscriber`);
  }

  this.state.subscribers[username] = chatId;
}

Controller.prototype.notifyAdmin = function(msg) {
  if (this.parameters.config.telegram.notifyAdmin) {
    let adminChats = this.state.adminChats;
    let telegram = this.telegram;

    Object.keys(adminChats).forEach(function(key){
      telegram.sendMessage(adminChats[key], msg, { reply_markup: { remove_keyboard: true }});
    });
  }
}

Controller.prototype.getStateData = function() {
	return {
    telegram: this.telegram.getStateData(),
    tjournal: this.tjournal.getStateData(),
    state:    this.state
	};
}

Controller.prototype.setStateData = function(input) {
  this.telegram.setStateData(input.telegram);
  this.tjournal.setStateData(input.tjournal);
  this.state = input.state;
}

Controller.prototype.processTelegramData = function(data) {
  if (data.isAdmin) {
    if (!this.state.adminChats[data.username]) {
      this.state.adminChats[data.username] = data.chatId;

      this.parameters.saveState(this.getStateData());
    }
  }

  // process only commands
  // if commands sent in first message and arguments in second then
  // they will be processed as command with arguments and "pending" flag
  if (data.cmd) {
    if (this.commands[data.cmd.cmd]) {
      this.commands[data.cmd.cmd](data, this);
    }
    else {
      this.telegram.sendUnknownCmd(data.chatId);
    }
  }
};

Controller.prototype.processWebhookData = function(webhookData) {  
  if (webhookData.type != 'new_comment') {
    return;
  }

  let toNotify = {};

  let data = webhookData.data;
  let controller = this;

  Object.keys(controller.state.subscribes).forEach(function(key){
    if (data.text.toLowerCase().indexOf(key.toLowerCase()) != -1) {
      let msg = '';
  
      if (data.creator.id > 0) {
        msg += `*${data.creator.name}*`;
        msg += "\n\n";
      }
  
      msg += `${data.text.escapeMarkdown()}\n\n*${data.content.title}*\ntjournal.ru/${data.content.id}?comment=${data.id}`;
  
      Object.keys(controller.state.subscribes[key]).forEach(function(chatId) {
        if (controller.state.subscribes[key][chatId]) {

          if (!toNotify[chatId]) {
            toNotify[chatId] = {};
            toNotify[chatId].terms = [];
          }

          toNotify[chatId].msg = msg;

          toNotify[chatId].terms.push(key);
        }
      });      
    }
  });

  Object.keys(toNotify).forEach(function(chatId){
    controller.telegram.sendMessage(chatId, `${toNotify[chatId].msg}\n\nключи: #${toNotify[chatId].terms.join(', #').escapeMarkdown()}`, 
      { parse_mode: "Markdown", 
        disable_web_page_preview: true });
  });
};