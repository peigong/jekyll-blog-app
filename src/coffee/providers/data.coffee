define ['jquery'], ($) ->
    version = 0
    settings = 0
    categories = {}
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
            if settings
                return settings
            else
                return false
        callback = (data) ->
            settings = data
            return settings
        
        getJSON './settings.json', check, callback

    getCategories = () ->
        check = () ->
            if categories
                return categories
            else
                return false
        callback = (data) ->
            copy = (src, dest) ->
                for val, key in src
                    if src.hasOwnProperty key
                        if key is 'categories'
                            dest[key] = {}
                            copy src[key], dest[key]
                        else
                            dest[key] = val
            
            if data and data.length
                for cate in data
                    if cate.name
                        categories[cate.name] = {}
                        copy cate, categories[cate.name]
            
            return categories

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
            return posts
        
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
