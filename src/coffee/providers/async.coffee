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
        for key, task of tasks
            errors[key] = null
            results[key] = null
            task createCallback key
            counts++
    exports = 
        parallel: parallel
    return exports
