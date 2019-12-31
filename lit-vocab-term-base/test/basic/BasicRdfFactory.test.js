'use strict'

require('mock-local-storage')

const BasicRdfFactory = require('../../src/basic/BasicRdfFactory')

const chai = require('chai')
const expect = chai.expect

describe('BasicRdfFactory tests', () => {
  it('should create literal', () => {
    const iri = 'test://iri'
    const literal = new BasicRdfFactory().literal(iri, 'ga');
    expect(literal.value).to.equal(iri);
    expect(literal.language).to.equal('ga');
  })
})
