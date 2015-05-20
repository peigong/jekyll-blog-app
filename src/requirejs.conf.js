requirejs.config({
  // 设置模块别名
  // RequireJS 2.0 中可以配置数组，顺序映射，当前面模块资源未成功加载时可顺序加载后续资源
  paths: {
    'async': '../lib/async',
    'text': '../lib/text',
    'jquery': '../lib/zepto',
    'doT': '../lib/doT',
    'director': '../lib/director',
    'swiper': '../lib/swiper.jquery',
    'EventEmitter': '../lib/EventEmitter'
  },
  shim: {
    async: {
      exports: 'async'
    },
    jquery: {
      exports: 'Zepto'
    },
    doT: {
      exports: 'doT'
    },
    director: {
      exports: 'Router'
    },
    EventEmitter: {
      exports: 'EventEmitter'
    }
  }
});
