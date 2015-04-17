define ['jquery'], ($) ->
    settings = {}
    categories = []
    posts = []
    dict = {}

    get = (url, check, callback) ->
        defer = $.Deferred()
        if url
            checked = check()
            if checked
                defer.resolve checked
            else
                $.getJSON url
                .then (data) ->
                    result = callback data
                    defer.resolve result
                .fail (err) ->
                    defer.reject err
        else
            defer.resolve ''
            
        return defer.promise()

    getSettings = () ->
        check = () ->
            if settings and settings.length
                return settings
            else
                return false
        callback = (data) ->
            settings = data
            return settings
        
        get './settings.json', check, callback

    getCategories = () ->
        check = () ->
            if categories and categories.length
                return categories
            else
                return false
        callback = (data) ->
            categories = data
            return categories
        
        get './categories.json', check, callback

    getPosts = () ->
        check = () ->
            if posts and posts.length
                return posts
            else
                return false
        callback = (data) ->
            push = (item) ->
                arr = item.link.split '/'
                item.filename = arr.pop()
                posts.push item
            push post for post in data when post.link.length
            return post
        
        get './posts.json', check, callback

    getPost = (link) ->
        check = () ->
            if dict.hasOwnProperty link
                return dict[link]
            else
                return false
        callback = (data) ->
            dict[link] = data
            return data
        
        get link, check, callback

    exports = 
        getSettings: getSettings
        getCategories: getCategories
        getPosts: getPosts
        getPost: getPost

    return exports
