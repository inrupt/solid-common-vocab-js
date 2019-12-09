require('mock-local-storage')

const LitContext = require('../../src/LitContext.js')

const moment = require('moment')

const chai = require('chai')
const expect = chai.expect

describe ('LitContext tests', () => {
  it ('should fail if no locale provided', function () {
    expect(() => new LitContext()).to.throw('*MUST* be provided a locale')
  })

  it ('should fail if no storage provided', function () {
    expect(() => new LitContext('en')).to.throw('*MUST* be provided storage')
  })

  it ('should create Ok', function () {
    const context = new LitContext('en', localStorage)
    expect(context).is.not.null
    expect(context.getLocale()).equals('en')
  })

  it ('should change locale Ok', function () {
    const context = new LitContext('en', localStorage)
    expect(context.getLocale()).equals('en')
    context.setLocale('es')
    expect(context.getLocale()).equals('es')

    // Should retain original locale too.
    expect(context.getInitialLocale()).equals('en')
  })

  it ('should be created now', function () {
    const now = moment().valueOf()
    const context = new LitContext('en', localStorage)
    expect(context.getCreatedAt() >= now).to.be.true
  })
})
