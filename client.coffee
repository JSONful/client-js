module = {};
setImmediate = setTimeout;

class JSONful extends EventEmitter
    constructor: (@server) ->
        @_queue = []
        @_callback = @_sendRequest.bind(this)
        super()

    _xhrRequest: (reqBody, onready) ->
        xhr = JSONful.getXhr()
        xhr.onload  = onready
        xhr.onerror = () ->
            console.error xhr.responseText

        xhr.open "POST", @server, true
        xhr.responseType = 'json'
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send JSON.stringify 
            requests: reqBody


    handle_responses: (responses, queue) ->
        for own key, value of responses
            if typeof value == "object" && value.error
                queue[key].failure value
            else
                queue[key].success value
        
        

    _sendRequest: () ->
        queue = @_queue
        requestBody = queue.map (b) ->
            [b.name, b.args]

        that = @;
        @_xhrRequest requestBody, () -> 
            responses = if not @response and typeof @responseText == "string" then JSON.parse @responseText else @response

            if not responses or not (responses instanceof Object) or not (responses.responses instanceof Array)
                that.emit("error", new Error("Invalid response from the server"), requestBody)
                return

            for own key, value of responses
                if typeof that["handle_" + key] == "function"
                    that["handle_" + key](value, queue)
                else
                    that.emit(key, value)


        @_queue = []


    exec: (name, args = [], callback = null) ->
        promise = new Promise ((success, failure) ->
             @_queue.push({name: name, args: args, success: success, failure: failure})
            ).bind(this)

        if typeof callback == "function"
            promise.then (response) ->
                callback null, response

            promise.catch (err) ->
                callback err, null

        clearTimeout @_sender
        @_sender = setTimeout(@_callback)
        promise 

JSONful.getXhr = () ->
    return new XMLHttpRequest

@JSONful = JSONful;
@Promise = Promise;
@EventEmitter = EventEmitter;
