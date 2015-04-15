define ['controllers/blog'], (blog) ->
    exports = 
        '/:channel/:category/(.*\.html)': blog.route.bind blog
        '/:channel/:category': blog.route.bind blog
        '/:channel': blog.route.bind blog
        '/': blog.route.bind blog
        
    return exports
