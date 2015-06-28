define [
    'jquery'
    'EventEmitter'
    'providers/data'
    'providers/template'
    'text!templates/nav.tmpl.html'
    'controllers/touch'
], ($, EventEmitter, data, template, navTmpl, touch) ->
    emitter = new EventEmitter
    class Navigation
        constructor: () ->
            that = @
            @loaded = false
            @timer = null
            @el = $ '#nav'
            if not @categories
                data.getCategories()
                .then @load.bind @
                .fail (err) ->
                    throw err
            $('body').click (e) ->
                that.hide()
        
        load: (categories) -> 
            convert = (obj) ->
                arr = []
                for key, val of obj
                    if obj.hasOwnProperty key
                        if val.categories
                            val.categories = convert val.categories
                        arr.push val
                return arr
            
            that = @
            @categories = convert categories
            @navHTML = template.render @categories, 'tmpl-nav', navTmpl
            @el.html @navHTML
            $ '#nav ul.master a'
            .click (e) ->
                that.show $ this
                touch.toList()
                #e.stopPropagation()
                return false;
            @loaded = true
            emitter.emit 'loaded'
        
        hide: () ->
            $ '#nav div.slave'
            .hide()

        show: (ele) ->
            that = @
            id = ele.attr 'data-id'
            that.hide();
            if that.timer
                clearTimeout that.timer 
            $ "#nav div.slave[data-master=#{ id }]"
            .show()
            that.timer = setTimeout () ->
                that.hide();
            , 5e3

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