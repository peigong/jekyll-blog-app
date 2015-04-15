define ['jquery', 'providers/data', 'providers/template'], ($, data, template) ->
    class Post
        constructor: () ->
            @el = $ '#post'
        setLink: (link, clazz) ->
            that = @
            that.el.html ''
            data.getPost(link)
            .then (text) ->
                that.el.html "<section class=\"#{ clazz }\">#{ text }</section>"
            .fail (err) ->
                throw err
    return new Post
