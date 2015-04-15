require ['director', 'routes'], (director, routes) ->
    router = director routes 
    router.configure 
        recurse: 'forward'
    router.init '/';
