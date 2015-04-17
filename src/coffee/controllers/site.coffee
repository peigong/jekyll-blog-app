define ['jquery', 'providers/data', 'providers/template'], ($, data, template) ->
    class Site
        constructor: () ->
            @loaded = false
            @banner = $ '#top-banner'
            @brand = $ '#brand'
            @copyright = $ '#copyright'

            if not @settings
                that = @
                data.getSettings()
                .then @load.bind @
                .fail (err) ->
                    throw err

        load: (settings) -> 
            that = @
            @settings = settings
            console.log 'load'
            console.log @settings
            
        render: () ->
            console.log 'render'
            console.log @settings

    return new Site