'use strict'

require('mock-local-storage')

const LitContext = require('../src/LitContext.js')
const LitContextError = require('../src/LitContextError.js')

const chai = require('chai')
const expect = chai.expect

describe('Context error tests', () => {
  const context = new LitContext('en', localStorage)

  beforeEach(() => {
    delete process.env.NODE_ENV
  })

  it('should fail if wrapped exception is not an Error', function () {
    try {
      new LitContextError(context, 'test', 'Not an error!')
      expect.fail()
    } catch (error) {
      expect(error.message).to.include('test', 'Not an error!')
    }
  })

  it('should create', function () {
    expect(new LitContextError(context, 'test')).to.not.be.null
  })

  it('should wrap standard error', function () {
    const message = 'Error occurred'
    try {
      throw new Error(message)
    } catch (error) {
      const wrapMessage = 'Wrap error message'
      const wrapError = new LitContextError(context, wrapMessage, error)
      expect(wrapError.countLevels()).to.equal(2)

      const fullReport = wrapError.unwrapException()
      expect(fullReport).to.include(message)
      expect(fullReport).to.include(wrapMessage)
    }
  })

  it('should contain wrapped exception details', function () {
    try {
      try {
        try {
          throw new LitContextError(context, 'Error message Level1')
        } catch (error) {
          throw new LitContextError(context, 'Error message Level2', error)
        }
      } catch (error) {
        throw new LitContextError(context, 'Error message Level3', error)
      }
    } catch (error) {
      expect(error.countLevels()).to.equal(3)
      const fullReport = error.unwrapException()
      expect(fullReport).to.include('Error message Level1')
      expect(fullReport).to.include('Error message Level2')
      expect(fullReport).to.include('Error message Level3')
    }
  })

  it('throwing a standard error loses nested information', function () {
    try {
      try {
        try {
          throw new LitContextError(context, 'Error message Level1')
        } catch (error) {
          throw new Error('Standard Error message Level2')
        }
      } catch (error) {
        try {
          throw new LitContextError(context, 'Error message Level3', error)
        } catch (error) {
          throw new LitContextError(context, 'Error message Level4', error)
        }
      }
    } catch (error) {
      expect(error.countLevels()).to.equal(3)
      const fullReport = error.unwrapException()
      expect(fullReport).to.not.include('Error message Level1')
      expect(fullReport).to.include('Standard Error message Level2')
      expect(fullReport).to.include('Error message Level3')
      expect(fullReport).to.include('Error message Level4')
    }
  })


  it('should contain wrapped exception details, but no stack info', function () {
    process.env.NODE_ENV = 'production'

    try {
      try {
        try {
          throw new LitContextError(context, 'Error message Level1')
        } catch (error) {
          throw new LitContextError(context, 'Error message Level2', error)
        }
      } catch (error) {
        throw new LitContextError(context, 'Error message Level3', error)
      }
    } catch (error) {
      expect(error.countLevels()).to.equal(3)
      const fullReport = error.unwrapException()
      expect(fullReport).to.include('Error message Level1')
      expect(fullReport).to.include('Error message Level2')
      expect(fullReport).to.include('Error message Level3')

      expect(fullReport).to.not.include('Level ')

    }
  })
  
  it('should unwrap when calling toString()', function() {
    const message = 'Error occurred'
    try {
      throw new Error(message)
    } catch (error) {
      const wrapMessage = 'Wrap error message'
      const wrapError = new LitContextError(context, wrapMessage, error)
      expect(wrapError.countLevels()).to.equal(2)
    
      const fullReport = wrapError.toString()
      expect(fullReport).to.include(message)
      expect(fullReport).to.include(wrapMessage)
    }
  })
  
  it('should check if our erorr contains specified values', function() {
    const message = 'Error occurred'
    try {
      throw new LitContextError(context, message)
    } catch (error) {
      expect(error.contains('Error', 'occurred')).to.be.true
      expect(error.contains('Error', 'does not', 'occurred')).to.be.false
    }
  })
  
  it('should return true if we don\'t actually check for any arguments', function() {
    const message = 'Error occurred'
    try {
      throw new LitContextError(context, message)
    } catch (error) {
      expect(error.contains()).to.be.true
    }
  })
  //
  // it('should invoke pre-handler when provided', function () {
  //   const context = new Context('en')
  //   let invoked = false
  //   new ContextError(context, 'test', () => { invoked = true })
  //   expect(invoked).to.be.true
  // })
})
