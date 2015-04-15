define ['doT'], (doT) ->
    handlers = {}
    
    exports = 
        render: (data, tmpl, def) ->
            if not handlers.hasOwnProperty tmpl
                ele = $ "##{ tmpl }"
                if ele.size() is 0
                    ele = $ "##{ def }"
                text = ''
                if ele.size() > 0
                    text = ele.text()
                    text = $.trim text
                if text
                    handlers[tmpl] = doT.template text
                else
                    handlers[tmpl] = () -> ''
            
            return handlers[tmpl] data

    return exports
