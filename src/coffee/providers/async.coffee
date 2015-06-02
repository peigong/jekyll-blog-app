define [], () ->
    parallel = (tasks, handler) ->
        counts = 0
        counter = 0
        errors = {}
        results = {}
        createCallback = (key) ->
            return (err, result)->
                counter++
                errors[key] = err
                results[key] = result
                if counter is counts
                    handler(errors, results)
        for task, key in tasks
            err[key] = null
            results[key] = null
            counts++
        for task, key in tasks
            task createCallback key
    exports = 
        parallel: parallel
    return exports
