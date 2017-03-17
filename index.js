;(function () {
  var RestJs = (function () {
    var isNode = (typeof window == 'undefined')
    assert(isNode || (typeof $ !== 'undefined' && Promise), 'Running restjs in browser requires JQuery and Promise support')
    var REST     = {}
    var request  = isNode && require('request')
    var bluebird = isNode && require('bluebird') || Promise
    var m        = isNode && restServer || restBrowser
    var extend   = isNode && require('extend') || $.extend

    function verbFunc(verb) {
      var method = verb === 'del' ? 'DELETE' : verb.toUpperCase()
      return function (uri, options, callback) {
        var params    = initParams(uri, options, callback)
        params.method = method
        return request(params, params.callback)
      }
    }

    // organize params for patch, post, put, head, del
    function initParams(uri, options, callback) {
      if (typeof options === 'function') {
        callback = options
      }

      var params = {}
      if (typeof options === 'object') {
        extend(params, options, { uri: uri })
      } else if (typeof uri === 'string') {
        extend(params, { uri: uri })
      } else {
        extend(params, uri)
      }

      params.callback = callback
      return params
    }

    request.options = verbFunc("options")
    request.patch   = verbFunc("patch")

    var methodMap = isNode && {
        GET    : bluebird.promisify(request.get),
        POST   : bluebird.promisify(request.post),
        DELETE : bluebird.promisify(request.del),
        PUT    : bluebird.promisify(request.put),
        OPTIONS: bluebird.promisify(request.options),
        PATCH  : bluebird.promisify(request.patch)
      }

    function restBrowser(method, url, headers, data) {
      if (!isNode && !$) console.log('Running in browser requires JQuery')
      return new bluebird(function (resolve, reject) {
        $.ajax(
          {
            url       : url,
            type      : method,
            data      : JSON.stringify(data),
            beforeSend: function (request) {
              return setOnRequest(request, headers)
            }
          }).then(function (result, status, headers) {
          resolve({ body: result, statusCode: headers.status, headers: headers })
        }).fail(function (e) {
          var error          = new Error()
          error.statusCode   = e.statusCode && e.statusCode().status || 401
          error.responseText = e.responseText || '{"error": "Failed to contact Server"}'
          reject(error)
        })
      })
    }

    function setOnRequest(request, headers) {
      if (!headers) return
      Object.keys(headers).forEach(function (key) {
        request.setRequestHeader(key, headers[key])
      })
    }

    function restServer(method, url, headers, data) {
      var response = methodMap[method]({ uri: url, json: data, headers: headers })
      return response.then(function (result) {
        var body = result && result.body
        assert(result.statusCode < 400, JSON.stringify(body), result.statusCode)
        body = (body && typeof body === 'string' && method != "OPTIONS") ? JSON.parse(body) : body
        return { body: body, statusCode: result.statusCode, headers: result.caseless }
      })
    }

    REST.getHeaderValue = function (headers, field) {
      assert(field, 'Provide field name of header')
      if (!headers) return
      return headers.getResponseHeader ? headers.getResponseHeader(field) : headers.get(field)
    }

    function rest(method, url, headers, data) {
      return m(method, url, headers, data)
    }

    REST.post = function (url, headers, data) {
      return rest("POST", url, headers, data)
    }

    REST.put = function (url, headers, data) {
      return rest("PUT", url, headers, data)
    }

    REST.get = function (url, headers) {
      return rest("GET", url, headers)
    }

    REST.del = function (url, headers) {
      return rest("DELETE", url, headers, undefined)
    }

    REST.options = function (url, headers) {
      return rest("OPTIONS", url, headers, undefined)
    }

    REST.patch = function (url, headers, data) {
      return rest("PATCH", url, headers, data)
    }

    function assert(condition, message, statusCode) {
      if (!condition) {
        var error = new Error(message || "Assertion failed")
        if (statusCode) error.statusCode = statusCode
        throw error
      }
    }

    return REST
  })()
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = RestJs;
  } else {
    if (typeof define === 'function' && define.amd) {
      define([], function () {
        return RestJs;
      });
    }
    else {
      window.restjs = RestJs;
    }
  }
})()


