'use strict'

require('mock-local-storage')

const rdf = require('rdf-ext')
const LitVocabTermBase = require('../../src/LitVocabTermBase')
const LitVocabTermBasic = require('../../src/basic/LitVocabTermBasic')

const chai = require('chai')
const expect = chai.expect

describe('LitVocabTermBasic tests', () => {
  const TEST_IRI_LOCAL_NAME = 'localName'
  const TEST_IRI = `test://iri#${TEST_IRI_LOCAL_NAME}`

  describe('Constructor', () => {
    it('Should behave as an IRI', () => {
      expect(new LitVocabTermBasic(TEST_IRI, localStorage).value)
        .to.equals(TEST_IRI)
    })

    it('Should flag local IRI name as English label', () => {
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
    it('Should process English label as localname', () => {
      const term = new LitVocabTermBasic(TEST_IRI, localStorage, true)

      expect(term.label).equals(TEST_IRI_LOCAL_NAME)
    })

    it('Should process labels and comments', () => {
      const term = new LitVocabTermBasic(TEST_IRI, localStorage)
        .addLabel('en', 'whatever label...')
        .addComment('en', 'whatever comment...')

      expect(term.label).equals('whatever label...')
      expect(term.comment).equals('whatever comment...')
    })

    it('Should fail if no messages', () => {
      const term = new LitVocabTermBasic(TEST_IRI, localStorage)

      expect(() => term.message('en')).to.throw(TEST_IRI, 'skos:definition')
    })
  })

  describe('Support basic implementation', () => {
    it('Should use English with params if requested language not found', () => {
      const term = new LitVocabTermBasic(TEST_IRI, localStorage, false)
        .addMessage('en', 'whatever {{0}} in English')

      const result = term.asRdfLiteral.messageParamsInLang('en', 'blah')
      expect(result.value).to.equal('whatever blah in English')
      expect(result.language).to.equal('en')

      expect(() => term.asLanguage('fr').messageParams('<use default>')
        .to.throw('whatever <use default> in English', 'en'))
    })
  })
})

