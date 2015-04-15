define ['controllers/nav', 'controllers/posts', 'controllers/post'], (nav, posts, post) ->
    class Blog 
        constructor: () ->

        route: (channel, category, link) ->
            channel = 'tcm' unless channel
            category = 'default' unless category

            nav.setCurrentNav channel, category
            posts.setCurrentList channel, category
            posts.getCurrentPostLink category, link
            .then (link) ->
                post.setLink(link, channel)
            return false

    return new Blog
