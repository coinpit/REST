module.exports = function (baseUrl) {
  var REST     = {}
  var bluebird = require('bluebird')
  var env      = require('jsdom').env
  var ENV      = bluebird.promisify(env)
  var JQUERY   = require('jquery')
  var promise  = typeof window !== 'undefined' ? bluebird.resolve(JQUERY.bind(JQUERY,window)) : ENV("").then(function (window) {
    return JQUERY(window)
  })

  var assert  = require('affirm.js')

  // /api/order
  // https://test.coinpit.io/api/order
  // https://testinsight.coinp.it/insight-api/tx/7012ueio21e02eio21ue9
  function rest1(method, url, headers, data) {
    return promise.then(function (jq) {
      var ajaxPromise = performAjax(jq, method, url, headers, data)
      ajaxPromise.then(console.log)
      return ajaxPromise
    })
  }

  function performAjax(jq, method, url, headers, data ){
    return bluebird.resolve(
      jq.ajax(
        {
          url       : baseUrl + url,
          type      : method,
          data      : JSON.stringify(data),
          beforeSend: function (request) {
            return setOnRequest(request, headers)
          }
        }).then(function (result, status, headers) {
        return { body: result, status: status, headers: headers }
      })
    )
  }

  function setOnRequest(request, headers) {
    Object.keys(headers).forEach(function (key) {
      request.setRequestHeader(key, headers[key])
    })
  }

  function getHeaderValue(headers, field) {
    assert(field, 'Provide field name of header')
    if (!headers) return
    return headers.getResponseHeader ? headers.getResponseHeader(field) : headers.get(field)
  }
  function rest (method, url, headers, data){
    var prom = rest1(method, url, headers, data)
    // prom.then(console.log)
    return prom
  }

  REST.post = function (url, headers, data) {
    return rest("POST", url, headers, data)
  }

  REST.put = function (url, headers, data) {
    return rest("PUT", url, headers, data)
  }

  REST.get = function (url, headers) {
    return rest("GET", url, headers, undefined)
  }

  REST.del     = function (url, headers) {
    return rest("DELETE", url, headers, undefined)
  }
  REST.options = function (url, headers) {
    return rest("OPTIONS", url, headers, undefined)
  }

  return REST
}
