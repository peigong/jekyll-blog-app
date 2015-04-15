define ['jquery', 'EventEmitter', 'providers/data', 'providers/template'], ($, EventEmitter, data, template) ->
    emitter = new EventEmitter
    class Navigation
        constructor: () ->
            @loaded = false
            @el = $ '#nav'
            if not @categories
                that = @
                data.getCategories()
                .then @load.bind @
                .fail (err) ->
                    throw err
        
        load: (categories) -> 
            that = @
            @categories = categories
            @navHTML = template.render @categories, 'tmpl-nav'
            @el.html @navHTML
            $ '#nav ul.master a'
            .click () ->
                that.show $ this
            @loaded = true
            emitter.emit 'loaded'

        show: (ele) ->
            id = ele.attr 'data-id'
            $ '#nav ul.slave'
            .hide()
            $ "#nav ul.slave[data-master=#{ id }]"
            .show()

        setCurrentNav: (channel, category) ->
            that = @
            init = () ->
                ele = $ "#nav ul.master a[data-id=#{ channel }]"
                that.show ele
            if @loaded
                init()
            else
                emitter.on 'loaded', init

    return new Navigation