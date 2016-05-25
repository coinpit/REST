var expect         = require('expect.js')
var bluebird       = require('bluebird')
var fixtures       = require('fixtures.js')(__filename)
var requireSubvert = require('require-subvert')(__dirname)

require('mocha-generators').install()

function stubMethods(params, cb) {
  cb()
}
Object.keys(fixtures.tests).forEach(function (method) {
  var test                 = fixtures.tests[method]
  stubMethods[test.method] = function (props, cb) {
    var result        = clone(test.result)
    result.caseless = result.headers
    delete result.headers
    cb(undefined, result)
  }
})

describe('Rest Test', function () {
  var rest
  before(function () {
    requireSubvert.subvert('request', stubMethods)
    rest = requireSubvert.require('../index')(fixtures.baseurl)
  })

  Object.keys(fixtures.tests).forEach(function (method, index) {
    var test = fixtures.tests[method];
    it(method, function*() {
      var result = yield rest[test.method](test.url, test.headers, test.body)
      expect(result).to.eql(test.result)
    })
  })
})

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}