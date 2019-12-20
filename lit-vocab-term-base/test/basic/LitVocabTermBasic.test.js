'use strict'

require('mock-local-storage')

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
        .to.equal(TEST_IRI)
    })
  })

  describe ('extracting IRI local name', () => {
    it ('should extract correctly', () => {
      const aliceIriAsString = 'https://alice.example.org/profile#me'
      const alice = new LitVocabTermBasic(aliceIriAsString, localStorage, false)

      expect(LitVocabTermBase.extractIriLocalName(alice)).to.equal('me')

      expect(LitVocabTermBase.extractIriLocalName(aliceIriAsString))
        .to.equal('me')

      expect(LitVocabTermBase.extractIriLocalName('https://example.com/whatever'))
        .to.equal('whatever')
    })
  })

  describe('Supports labels and comments', () => {
    it('Should process English label as localname if unstrict', () => {
      const term = new LitVocabTermBasic(TEST_IRI, localStorage, false)

      expect(term.label.value).equals(TEST_IRI_LOCAL_NAME)
    })

    it('Should process labels and comments', () => {
      const term = new LitVocabTermBasic(TEST_IRI, localStorage)
        .addLabel('whatever label...', 'en')
        .addComment('whatever comment...', 'en')

      expect(term.label.value).equals('whatever label...')
      expect(term.comment.value).equals('whatever comment...')
    })

    it('Should return undefined if no messages', () => {
        const termStrict = new LitVocabTermBasic(TEST_IRI, localStorage, true)
        expect(termStrict.message).to.be.undefined

        const termUnstrict = new LitVocabTermBasic(TEST_IRI, localStorage, false)
        expect(termUnstrict.message).to.be.undefined
    })
  })
})
