define [
    'jquery'
    'providers/data'
    'providers/template'
], ($, data, template) ->
    class Post
        constructor: () ->
            @el = $ '#post'
        setLink: (link) ->
            that = @
            that.el.html ''
            data.getPost(link)
            .then (text) ->
                that.el.html "<section>#{ text }</section>"
                $ 'article.post-content a', that.el
                .attr 'target', '_blank'
            .fail (err) ->
                throw err
    return new Post
