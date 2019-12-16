'use strict'

require('mock-local-storage')

const rdf = require('rdf-ext')
const LitContext = require('../../src/LitContext')
const LitVocabTermBase = require('../../src/LitVocabTermBase')
const LitVocabTermBasic = require('../../src/basic/LitVocabTermBasic')

const chai = require('chai')
const expect = chai.expect

describe('LitVocabTermBasic tests', () => {
  describe('Constructor', () => {
    it('should behave as an IRI', () => {
      const iri = 'test://iri'
      expect(new LitVocabTermBasic(iri, localStorage).value).to.equals(iri)
    })

    it('should flag local IRI name as English label', () => {
      const iri = 'test://iri#localTermName'
      expect(new LitVocabTermBasic(iri, localStorage, true).label)
        .to.equals('localTermName')
    })
  })

  describe ('extracting IRI local name', () => {
    it ('should extract correctly', () => {
      const aliceIriAsString = 'https://alice.example.org/profile#me'
      const alice = new LitVocabTermBasic(aliceIriAsString, localStorage);

      expect(LitVocabTermBase.extractIriLocalName(alice)).to.equal('me')

      expect(LitVocabTermBase.extractIriLocalName(aliceIriAsString))
        .to.equal('me')

      expect(LitVocabTermBase.extractIriLocalName('https://example.com/whatever'))
        .to.equal('whatever')
    })
  })

  describe('Supports labels and comments', () => {
    it('should process English label as localname', () => {
      const iri = 'test://iri#whatever'
      const term = new LitVocabTermBasic(iri, localStorage, true)
      expect(term.label).equals('whatever')
    })

    it('should process labels and comments', () => {
      const iri = 'test://iri#whatever'
      const term = new LitVocabTermBasic(iri, localStorage)
        .addLabel('en', 'whatever')
        .addComment('en', 'User comment')

      expect(term.label).equals('whatever')
      expect(term.comment).equals('User comment')
    })

    it('should fail if no messages', () => {
      const iri = 'test://iri'
      const term = new LitVocabTermBasic(iri, localStorage)

      expect(() => term.message('en'))
        .to.throw(iri, 'skos:definition')
    })
  })
})

