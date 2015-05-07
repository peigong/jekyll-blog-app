define [
    'providers/data',
    'controllers/nav',
    'controllers/posts',
    'controllers/post'
], (data, nav, posts, post) ->
    class Blog 
        constructor: () ->
        show: (channel, category, link) ->
            nav.setCurrentNav channel, category
            posts.setCurrentList channel, category
            posts.getCurrentPostLink category, link
            .then (link) ->
                post.setLink(link, channel)
        route: (channel, category, link) ->
            that = @
            category = 'default' unless category
            if channel
                that.show channel, category, link
            else
                data.getCategories()
                .then (categories) ->
                    if categories.length
                        channel = categories[0].name
                        that.show channel, category, link
                .fail (err) ->
                    throw err
            return false

    return new Blog
