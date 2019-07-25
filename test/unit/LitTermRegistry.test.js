'use strict'

require('mock-local-storage')

const LitTermRegistry = require('../../src/LitTermRegistry')
const LitVocabTerm = require('../../src/LitVocabTerm')

const chai = require('chai')
const expect = chai.expect

describe('LitTermRegistry tests', () => {
  it('should lookup correctly', () => {
    const iri = 'test://iri'
    const term = new LitVocabTerm(iri, localStorage)
      .addLabel('es', 'Hola!')
      .addComment('es', 'Hola comment!')
      .addMessage('es', 'Hola message!')

    expect(LitTermRegistry.lookupLabel(iri, 'en')).to.be.null
    expect(LitTermRegistry.lookupLabel(iri, 'es')).to.equal('Hola!')

    expect(LitTermRegistry.lookupComment(iri, 'en')).to.be.null
    expect(LitTermRegistry.lookupComment(iri, 'es')).to.equal('Hola comment!')

    expect(LitTermRegistry.lookupMessage(iri, 'en')).to.be.null
    expect(LitTermRegistry.lookupMessage(iri, 'es')).to.equal('Hola message!')
  })
})
