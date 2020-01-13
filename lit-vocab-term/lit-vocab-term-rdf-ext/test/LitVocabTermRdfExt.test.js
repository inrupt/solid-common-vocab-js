'use strict'

require('mock-local-storage')

const rdf = require('rdf-ext')
const LitVocabTermRdfExt = require('../src/LitVocabTermRdfExt')

const chai = require('chai')
const expect = chai.expect

describe('LitVocabTermRdfExt tests', () => {
  describe('Constructor', () => {
    it('should behave as an IRI', () => {
      const iri = 'test://iri'
      const namedNode = rdf.namedNode(iri)

      const vocabTerm = new LitVocabTermRdfExt(iri, localStorage)
      expect(vocabTerm.value).to.equal(iri)
      expect(vocabTerm.value).to.equal(namedNode.value)
      expect(vocabTerm.getIri()).to.equal(iri)
    })

    it('should behave as a LIT Vocab Term', () => {
      const iri = 'test://iri#whatever'
      const term = new LitVocabTermRdfExt(iri, localStorage, false)
      expect(term.asLanguage('en').label.value).equals('whatever')
    })
  })

  describe('Setters and getters', () => {
    it('Should get', () => {
      const iri = 'test://iri'
      const vocabTerm = new LitVocabTermRdfExt(iri, localStorage)
      expect(vocabTerm.getIri()).equals(iri)
    })

    it('Should ignore set completely!', () => {
      const iri = 'test://iri'
      const vocabTerm = new LitVocabTermRdfExt(iri, localStorage)
      expect(vocabTerm.setIri('test://new-value').getIri()).equals(iri)
    })
  })
})
