var expect         = require('expect.js')
var bluebird       = require('bluebird')
var request        = require('request')
var fixtures       = require('fixtures.js')(__filename)
var requireSubvert = require('require-subvert')(__dirname)
var REST

require('mocha-generators').install()

var stubMethods = function () {
  return {
    ajax: function (props) {
      var result = fixtures.tests[props.type].result
      return {
        then: function (fn) {
          fn(result.body, result.status, result.headers)
          return fn.call(undefined, result.body, result.status, result.headers)
        }
      }
    }
  }
}

describe('Rest Test', function () {
  var rest
  before(function () {
    requireSubvert.subvert('jquery', stubMethods)
    rest = requireSubvert.require('../index')(fixtures.baseurl)
  })

  Object.keys(fixtures.tests).forEach(function (method, index) {
    var test = fixtures.tests[method];
    it(method, function*() {
      var result = yield rest[test.method](test.url, test.header, test.body)
      expect(result).to.eql(test.result)
    })
  })
})
