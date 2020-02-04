'use strict'

require('mock-local-storage')
const rdf = require('rdf-ext')

const LitContext = require('../src/LitContext')
const LitVocabTermBase = require('../src/LitVocabTermBase')

const chai = require('chai')
const expect = chai.expect

/**
 * This Turtle snippet can help to illustrate some of the usage patterns below,
 * with the term 'ex:name' defined as the constant 'TEST_TERM_NAME'.
 *
 *   prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
 *   prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
 *   prefix ex:   <http://example.com/>
 *
 *   ex:name a rdf:Property ;
 *     rdfs:label "Name" ;
 *     rdfs:label "First name"@en ;
 *     rdfs:label "Nombre"@es .
 */
describe('LitVocabTermBase tests', () => {
  const TEST_TERM_NAME_PATH = 'localName'
  const TEST_TERM_NAME = `test://iri#${TEST_TERM_NAME_PATH}`

  describe('Strict support', () => {
    it('Should not use IRI local name if no label and strict', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, true)
      expect(term.label).to.be.undefined
    })

    it('Should throw if mandatory and no label and strict', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, true)
      expect(() => term.mandatory.label).to.throw(TEST_TERM_NAME)
    })

    it('Should fail to add values if no value or language provided', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, true)

      expect(() => term.addLabel()).to.throw('label', 'non-existent')
        expect(() => term.addLabel('test value...'))
            .to.throw('label', 'test value...', 'language')
        expect(() => term.addLabel('test value...', ''))
            .to.throw('label', 'test value...', 'language')

      expect(() => term.addComment()).to.throw('comment', 'non-existent')
        expect(() => term.addComment('test value...'))
            .to.throw('comment', 'test value...', 'language')
        expect(() => term.addComment('test value...', ''))
            .to.throw('comment', 'test value...', 'language')

      expect(() => term.addMessage()).to.throw('message', 'non-existent')
        expect(() => term.addMessage('test value...'))
            .to.throw('message', 'test value...', 'language')
        expect(() => term.addMessage('test value...', ''))
            .to.throw('message', 'test value...', 'language')
    })

    it('Should add no-language values', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, false)
          .addLabelNoLanguage('test label...')
          .addCommentNoLanguage('test comment...')
          .addMessageNoLanguage('test message...')

      expect(term.label.value).to.equal('test label...')
      expect(term.label).deep.equal(rdf.literal('test label...', ''))

      expect(term.comment.value).to.equal('test comment...')
      expect(term.message.value).to.equal('test message...')
    })

    it('Should still fallback to English if language not found', () => {
      const term = new LitVocabTermBase(
        TEST_TERM_NAME, rdf, localStorage, true)
        .addLabel(`English label...`, 'en')
        .addComment(`English comment...`, 'en')

      expect(term.asLanguage('fr').label)
          .deep.equal(rdf.literal(`English label...`, 'en'))
      expect(term.asLanguage('fr').comment)
          .deep.equal(rdf.literal(`English comment...`, 'en'))
    })

    it('Calling mandatory on strict term is unnecessary', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, true)
      expect(() => term.mandatory.label).to.throw(TEST_TERM_NAME, 'en', 'no values')
    })
  })

  describe('Supports labels and comments', () => {
    it('Should use the label context', () => {
      const label = 'Irish label string'
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, false)
        .addLabel(label, 'ga')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'ga')
      expect(term.label).deep.equals(rdf.literal(label, 'ga'))
    })

    it('Should use the IRI local name as English label, if needed', () => {
      const unStrictTerm = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, false)

      // NOTE: The returned literal has a 'No-Language' tag!
      expect(unStrictTerm.label).deep.equals(rdf.literal(TEST_TERM_NAME_PATH, ''))
      expect(unStrictTerm.label.value).equals(TEST_TERM_NAME_PATH)

      const englishLabel =  'English language value'
      unStrictTerm.addLabel(englishLabel, 'en')
      expect(unStrictTerm.label).deep.equals(rdf.literal(englishLabel, 'en'))
      expect(unStrictTerm.label.value).equals(englishLabel)
      expect(unStrictTerm.mandatory.label.value).equals(englishLabel)
    })

    it('Should default to English value language', () => {
      const englishLabel = 'English label...'
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, false)
        .addLabel(englishLabel, 'en')

      expect(term.asLanguage('ga').label.value).equals(englishLabel)
    })

    it('Should override language', () => {
      const irishLabel = 'Irish label...'
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, true)
        .addLabel(irishLabel, 'ga')

      expect(term.label).to.be.undefined
      expect(term.asLanguage('fr').label).to.be.undefined

      const englishLabel = 'English label...'
      term.addLabel(englishLabel, 'en')

      expect(term.label.value).equals(englishLabel)
      expect(term.asLanguage('').label.value).equals(englishLabel)
      expect(term.asLanguage('fr').label.value).equals(englishLabel)
      expect(term.asLanguage('ga').label.value).equals(irishLabel)

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'ga')
      expect(term.label.value).equals(irishLabel)
      expect(term.asLanguage('').label.value).equals(englishLabel)
    })

    it('Should throw if mandatory language not found and strict', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, true)
        .addLabel('Test label in English...', 'en')

      expect(() => term.mandatory.asLanguage('fr').label)
        .to.throw(TEST_TERM_NAME, 'fr', 'no values')

      expect(() => term.mandatory.comment)
        .to.throw(TEST_TERM_NAME, 'fr', 'no values')

      expect(() => term.mandatory.message)
        .to.throw(TEST_TERM_NAME, 'fr', 'no values')
    })

    it('Should return undefined if mandatory language not found and unstrict', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, false)
        .addLabel('Test label in English...', 'en')

      expect(() => term.mandatory.asLanguage('fr').label).to.throw(TEST_TERM_NAME, 'fr')
      expect(() => term.mandatory.comment).to.throw(TEST_TERM_NAME, 'en')
      expect(() => term.mandatory.message).to.throw(TEST_TERM_NAME, 'en')
    })

    it('Should use the comment context', () => {
      const comment = 'test label string'
      const term = new LitVocabTermBase(
        'test://iri',
        rdf,
        localStorage,
        undefined).addComment(comment, 'en')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.comment.value).equals(comment)
    })
  })

  describe('Supports messages (rdfs:literals)', () => {
    it('Should access literal definition with language from context without params', () => {
      const iri = 'test://iri'
      const term = new LitVocabTermBase(iri, rdf, localStorage, false)
        .addMessage('whatever test', 'en')
        .addMessage('test whatever in Spanish', 'es')

      expect(term.message.value).equals('whatever test')
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.message.value).equals('test whatever in Spanish')
    })

    it('Should ignore locale from our context if explicit language, with one param', () => {
      const term = new LitVocabTermBase('test://iri', rdf, localStorage, false)
        .addMessage('Params test {{0}} and {{1}}', 'en')
        .addMessage('Prueba de parámetros {{0}} y {{1}}', 'es')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.messageParams('first', 'second').value)
        .equals('Prueba de parámetros first y second')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.messageParams('first', 'second').value)
        .equals('Params test first and second')
    })

    it('Should ignore locale from our context if explicit language, with params', () => {
      const term = new LitVocabTermBase('test://iri', rdf, localStorage, false)
        .addMessage('Params test {{0}} and {{1}}', 'en')
        .addMessage('Prueba de parámetros {{0}} y {{1}}', 'es')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.asLanguage('en')
          .messageParams('first', 'second').value)
        .equals('Params test first and second')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.asLanguage('es')
          .messageParams('first', 'second').value)
        .equals('Prueba de parámetros first y second')
    })
  })

  describe ('extracting IRI local name', () => {
    it ('Should throw if no local name', () => {
      expect(() => LitVocabTermBase.extractIriLocalName(
        'http://example.com-whatever')).to.throw('Expected hash')

      expect(() => LitVocabTermBase.extractIriLocalName(
        'https://example.com-whatever')).to.throw('Expected hash')
    })
  })

  describe ('is string', () => {
    it ('Should determine correctly', () => {
      expect(LitVocabTermBase.isString('test user name')).to.be.true
      expect(LitVocabTermBase.isString(
        new String('test user name'))).to.be.true

      expect(LitVocabTermBase.isString(57)).to.be.false
      expect(LitVocabTermBase.isString({ })).to.be.false
    })

    it ('Should determine IRI correctly', () => {
      expect(LitVocabTermBase.isStringIri('HTTP://xyz')).to.be.true
      expect(LitVocabTermBase.isStringIri('http://xyz')).to.be.true
      expect(LitVocabTermBase.isStringIri('HTTPS://xyz')).to.be.true
      expect(LitVocabTermBase.isStringIri('HTTPs://xyz')).to.be.true

      expect(LitVocabTermBase.isStringIri('http:/xyz')).to.be.false
      expect(LitVocabTermBase.isStringIri('HTTPs//xyz')).to.be.false

      expect(LitVocabTermBase.isStringIri(1.99)).to.be.false
    })
  })

  describe ('Using asRdfLiteral explicitly', () => {
    it('Should return RDF literal', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, false)
          .addLabel('test label...', 'en')

      expect(term.label).deep.equal(rdf.literal('test label...', 'en'))
      expect(term.asRdfLiteral.label)
          .deep.equal(rdf.literal('test label...', 'en'))
    })
  })

  describe ('Using asString explicitly', () => {
    it('Should return simple string', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, false)
          .addLabelNoLanguage('test label...')

        expect(term.label.value).equals('test label...')
        expect(term.asString.label).equals('test label...')
    })
  })

  describe ('Term serialization', () => {
    it('Should only serialize the expected information', () => {
      const term = new LitVocabTermBase(TEST_TERM_NAME, rdf, localStorage, false)
          .addLabelNoLanguage('test label...')
        expect(term.serialize()).equals(JSON.stringify({"value": term.value, "termType": term.termType}))
    })
  })
})
