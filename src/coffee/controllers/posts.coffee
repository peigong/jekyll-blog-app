define [
    'async', 'jquery', 'EventEmitter', 'providers/data', 'providers/template'
    ], (async, $, EventEmitter, data, template) ->
    emitter = new EventEmitter
    class Posts
        constructor: () ->
            that = @
            @loaded = false
            @el = $ '#list'
            @categories = {};
            @posts = {}
            @currentList = []
            @key = '__all__'

            async.parallel
                categories: (callback) ->
                    data.getCategories()
                    .then (categories) ->
                        callback null, categories
                    .fail (err) ->
                        callback err
                posts: (callback) ->
                    data.getPosts()
                    .then (posts) ->
                        callback null, posts
                    .fail (err) ->
                        callback err
            , (err, results) ->
                categories = results.categories
                posts = results.posts
                categories = {} unless categories
                posts = [] unless posts
                that.load categories, posts

        load: (categories, posts) ->
            for category in categories
                @categories[category.name] = []
                @categories[category.name].push cate.name for cate in category.categories
            
            @posts[@key] = posts
            @loaded = true
            emitter.emit 'loaded'

        getPosts: (channel, category) ->
            that = @
            key = ['posts', channel, category].join '-'
            unless @posts.hasOwnProperty key
                @posts[key] = []
                if category is 'default'
                    check = (cate, counter) ->
                        return (cate in that.categories[channel]) and (counter < 30)
                else if category
                    check = (cate) ->
                        return cate is category
                if @posts.hasOwnProperty @key
                    counter = 0
                    for post in @posts[@key]
                        if check post.categories, counter
                            @posts[key].push(post)
                            counter++
            return @posts[key]

        setCurrentList: (channel, category) ->
            that = @
            set = () ->
                that.currentList = that.getPosts channel, category
                it = 
                    channel: channel
                    posts: that.currentList
                listHTML = template.render it, "tmpl-#{ channel }-list",  'tmpl-common-list'
                that.el.html listHTML
                emitter.emit 'current-list-ready'
            
            that.el.html ''
            if @loaded
                set()
            else
                emitter.on 'loaded', set

        getCurrentPostLink: (category, link) ->
            that = @
            defer = $.Deferred()
            get = () ->
                if  that.currentList.length
                    defer.resolve that.currentList[0].link
                else
                    defer.resolve ''
            
            if category and link
                url = ['articles', category, link].join '/'
                defer.resolve url
            else if @loaded
                get()
            else
                emitter.on 'current-list-ready', get

            return defer.promise()

    return new Posts