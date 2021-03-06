define [
    'EventEmitter'
    'providers/data'
    'controllers/nav'
    'controllers/posts'
    'controllers/post'
], (EventEmitter, data, nav, posts, post) ->
    emitter = new EventEmitter
    class Blog
        constructor: () ->
            that = @
            @loaded = false
            if not @categories
                data.getCategories()
                .then @load.bind @
                .fail (err) ->
                    throw err
        load: (categories) ->
            that = @
            if categories
                that.categories = categories
            that.loaded = true
            emitter.emit 'loaded'
        show: (channel, category, link) ->
            pickFirst = (categories) ->
                if categories
                    for name, cate of categories
                        if categories.hasOwnProperty name
                            return name
                return ''
            if not channel
                channel = pickFirst @categories
            if not category
                category = pickFirst @categories[channel].categories
            posts.setCurrentList channel, category
            posts.getCurrentPostLink category, link
            .then (link) ->
                post.setLink link
        route: (channel, category, link) ->
            that = @
            show = () ->
                that.show channel, category, link
            if that.loaded
                show()
            else
                emitter.on 'loaded', show
            return false

    return new Blog
