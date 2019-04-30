'use strict';

module.exports = utils;

function utils() {
  // breaks array to array of arrays with limited length
  Object.defineProperty(Array.prototype, 'chunk', {
    value: function(chunkSize) {
      var array=this;
      return [].concat.apply([],
        array.map(function(elem,i) {
          return i%chunkSize ? [] : [array.slice(i,i+chunkSize)];
        })
      );
    }
  });

  // Escape markdown symbols * and _ in string
  Object.defineProperty(String.prototype, 'escapeMarkdown', {
    value: function() {      
      return this.replace(/\*/gi,'\\*').replace(/\_/gi,'\\_');
    }
  });
}

