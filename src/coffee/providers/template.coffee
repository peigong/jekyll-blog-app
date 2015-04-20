define ['doT'], (doT) ->
    handlers = {}
    
    exports = 
        render: (data, id, tmpl) ->
            if not handlers.hasOwnProperty id
                if tmpl
                    handlers[id] = doT.template tmpl
                else
                    handlers[id] = () -> ''
            
            return handlers[id] data

    return exports
