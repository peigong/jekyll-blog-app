define ['jquery', 'providers/data', 'providers/template'], ($, data, template) ->
    class Site
        constructor: () ->
            @loaded = false
            @banner = $ '#top-banner'
            @brand = $ '#brand'
            @copyright = $ '#copyright'
            if not @settings
                that = @
                data.getSiteSettings()
                .then @load.bind @
                .fail (err) ->
                    throw err
        load: (settings) -> 
            that = @
            @settings = settings
    return new Navigation