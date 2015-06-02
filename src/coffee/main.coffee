requirejs.config
    baseUrl: 'scripts/app'
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

require [
    'jquery'
    'director'
    'routes'
    'controllers/site'
    'controllers/nav'
    'controllers/touch'
], ($, director, routes, site, nav, touch) ->
    router = director routes 
    router.configure 
        recurse: 'forward'
    router.init '/';
