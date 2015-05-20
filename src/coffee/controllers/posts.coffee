define [
    'async'
    'jquery'
    'EventEmitter'
    'providers/data'
    'providers/template'
    'text!templates/list_has_date.tmpl.html'
    'text!templates/list_no_date.tmpl.html'
    'controllers/touch'
], (async, $, EventEmitter, data, template, hasDateTmpl, noDateTmpl, touch) ->
    dict = 
        list_has_date: hasDateTmpl
        list_no_date: noDateTmpl
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
            that.el.delegate 'ul li a', 'click', ()->
                touch.toPost()

        load: (categories, posts) ->
            for category in categories
                category.pool = []
                category.pool.push cate.name for cate in category.categories
                @categories[category.name] = category
            
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
                        return (cate in that.categories[channel].pool) and (counter < 30)
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
                id = 'tmpl-common-list'
                tmpl = hasDateTmpl
                if that.categories.hasOwnProperty(channel) and that.categories[channel] and that.categories[channel].tmpl
                    tmpl_key = that.categories[channel].tmpl
                    if dict.hasOwnProperty tmpl_key
                        id = "tmpl-#{ channel }-list"
                        tmpl = dict[tmpl_key]
                listHTML = template.render it, id, tmpl
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