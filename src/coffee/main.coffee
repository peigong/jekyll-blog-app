requirejs.config
    baseUrl: 'scripts/app'
    paths:
        'async': '../lib/async',
        'text': '../lib/text',
        'jquery': '../lib/zepto',
        'doT': '../lib/doT',
        'director': '../lib/director',
        'EventEmitter': '../lib/EventEmitter'
    shim:
      async:
        exports: 'async'
      jquery:
        exports: 'Zepto'
      doT:
        exports: 'doT'
      director:
        exports: 'Router'
      EventEmitter:
        exports: 'EventEmitter'

require ['director', 'routes', 'controllers/site'], (director, routes, site) ->
    router = director routes 
    router.configure 
        recurse: 'forward'
    router.init '/';
