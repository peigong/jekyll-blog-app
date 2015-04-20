define [
    'jquery'
    'providers/data'
    'providers/template'
    'text!templates/top_banner.tmpl.html'
    'text!templates/copyright.tmpl.html'
    'text!templates/statistics_cnzz.tmpl.html'
], ($, data, template, bannerTmpl, copyrightTmpl, statisticsTmpl) ->
    class Site
        constructor: () ->
            @banner = $ '#top-banner'
            @brand = $ '#brand'
            @copyright = $ '#copyright'
            @statistics = $ '#statistics'

            if not @settings
                that = @
                data.getSettings()
                .then @load.bind @
                .fail (err) ->
                    throw err

        load: (settings) -> 
            that = @
            @settings = settings
            
            site = settings.site
            document.title = "#{ site.title }- #{ site.brand }"
            @brand.html site.brand
            @render @banner, { text: site.tagline }, 'top-banner', bannerTmpl
            @render @copyright, { text: site.copyright }, 'copyright', copyrightTmpl
            #@render @statistics, {}, 'statistics', statisticsTmpl

        render: (container, data, id, tmpl) ->
            html = template.render data, "tmpl-#{ id }", tmpl
            container.html html

    return new Site