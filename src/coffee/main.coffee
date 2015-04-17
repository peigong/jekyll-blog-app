require ['director', 'routes', 'controllers/site'], (director, routes, site) ->
    site.render()
    
    router = director routes 
    router.configure 
        recurse: 'forward'
    router.init '/';
