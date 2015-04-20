requirejs.config
    baseUrl: 'scripts/app'
    paths:
        'async': 'scripts/lib/async',
        'jquery': 'scripts/lib/zepto',
        'doT': 'scripts/lib/doT',
        'director': 'scripts/lib/director',
        'EventEmitter': 'scripts/lib/EventEmitter'
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
    site.render()
    
    router = director routes 
    router.configure 
        recurse: 'forward'
    router.init '/';
