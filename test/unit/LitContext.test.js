'use strict'

const RifContext = require('../../src/LitContext.js')

const moment = require('moment')

const chai = require('chai')
const expect = chai.expect

describe ('RifContext tests', () => {
  it ('should fail if no locale provided', function () {
    expect(() => new RifContext()).to.throw('none was provided')
  })

  it ('should fail if no storage provided', function () {
    // Use an local emulator instead!
    // expect(() => new RifContext('en')).to.throw('none was provided')
  })

  it ('should create Ok', function () {
    const context = new RifContext('en')
    expect(context).is.not.null
    expect(context.getLocale()).equals('en')
  })

  it ('should change locale Ok', function () {
    const context = new RifContext('en')
    expect(context.getLocale()).equals('en')
    context.setLocale('es')
    expect(context.getLocale()).equals('es')

    // Should retain original locale too.
    expect(context.getInitialLocale()).equals('en')
  })

  it ('should be created now', function () {
    const now = moment().valueOf()
    const context = new RifContext('en')
    expect(context.getCreatedAt() >= now).to.be.true
  })

  it ('should use specific local storage', function () {
    const context = new RifContext('en', new RifContext.EmulateLocalStorage())
    expect(context.getLocale()).equals('en')
  })

  it ('should create using GLOBAL local storage', function () {
    global.localStorage = new RifContext.EmulateLocalStorage()
    const context = new RifContext('en')
    expect(context.getLocale()).equals('en')
    global.localStorage = undefined
  })
})
