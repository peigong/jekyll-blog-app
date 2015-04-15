define ['jquery'], ($) ->
    categories = []
    posts = []
    dict = {}

    exports = 
        getCategories: () ->
            defer = $.Deferred()
            if categories and categories.length
                defer.resolve categories
            else
                $.getJSON './categories.json'
                .then (data) ->
                    categories = data
                    defer.resolve categories
                .fail (err) ->
                    defer.reject err
            return defer.promise()

        getPosts: () ->
            defer = $.Deferred()
            if posts and posts.length
                defer.resolve posts
            else
                $.getJSON './posts.json'
                .then (data) ->
                    push = (item) ->
                        arr = item.link.split '/'
                        item.filename = arr.pop()
                        posts.push item
                    push post for post in data when post.link.length
                    defer.resolve posts
                .fail (err) ->
                    defer.reject err
            return defer.promise()

        getPost: (link) ->
            defer = $.Deferred()
            if dict.hasOwnProperty link
                defer.resolve dict[link]
            else if link
                $.get link
                .then (text) ->
                    dict[link] = text
                    defer.resolve text
                .fail (err) ->
                    defer.reject err
            else
                err = new Error 'link is empty.'
                #defer.reject err
            return defer.promise()

    return exports
