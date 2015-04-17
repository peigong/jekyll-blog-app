define ['jquery'], ($) ->
    version = 0
    settings = {}
    categories = []
    posts = []
    dict = {}

    ajax = (method, url, check, callback) ->
        defer = $.Deferred()
        if url
            checked = check()
            if checked
                defer.resolve checked
            else
                $[method] url
                .then (data) ->
                    result = callback data
                    defer.resolve result
                .fail (err) ->
                    defer.reject err
        else
            defer.resolve ''
            
        return defer.promise()

    get = (url, check, callback) ->
        ajax 'get', url, check, callback

    getJSON = (url, check, callback) ->
        ajax 'getJSON', url, check, callback

    getVersion = () ->
        check = () ->
            if version
                return version
            else
                return false
        callback = (data) ->
            date = new Date data.lastModified
            version = date.getTime() / 1e3
            return version
        
        get './CNAME', check, callback
    
    getSettings = () ->
        check = () ->
            if settings and settings.length
                return settings
            else
                return false
        callback = (data) ->
            settings = data
            return settings
        
        getJSON './settings.json', check, callback

    getCategories = () ->
        check = () ->
            if categories and categories.length
                return categories
            else
                return false
        callback = (data) ->
            categories = data
            return categories
        
        getVersion()
        .then (version) ->
            console.log version

        getJSON './categories.json', check, callback

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
        
        getJSON './posts.json', check, callback

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
