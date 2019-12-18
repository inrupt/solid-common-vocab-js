'use strict'

require('mock-local-storage')
const rdf = require('rdf-ext')

const LitContext = require('../src/LitContext')
const LitVocabTermBase = require('../src/LitVocabTermBase')

const chai = require('chai')
const expect = chai.expect

describe('LitVocabTermBase tests', () => {
  const TEST_IRI_LOCAL_NAME = 'localName'
  const TEST_IRI = `test://iri#${TEST_IRI_LOCAL_NAME}`

  describe('Strict support', () => {
    it('Should not use IRI local name if no label and strict', () => {
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)

      expect(() => term.label).to.throw(TEST_IRI, 'en', 'no values')
    })

    it('Should still fallback to English if language not found', () => {
      const term = new LitVocabTermBase(
        TEST_IRI, rdf, localStorage, true)
        .addLabel('en', `English label...`)
        .addComment('en', `English comment...`)

      expect(term.asLanguage('fr').label).equals(`English label...`)
      expect(term.asLanguage('fr').comment).equals(`English comment...`)
    })

    it('Should require explicitly English label and comment if mandatory', () => {
      const term = new LitVocabTermBase(
        TEST_IRI, rdf, localStorage, true)
        .addLabel('', `No-language label isn't enough for 'mandatory'...`)
        .addComment('', `No-language comment isn't enough for 'mandatory'...`)

      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')
      expect(() => term.mandatory.comment).to.throw(TEST_IRI, 'en', 'no values')
    })

    it('Calling mandatory on strict term is unnecessary', () => {
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)
      expect(() => term.mandatory.label).to.throw(TEST_IRI, 'en', 'no values')
    })
  })

  describe('Supports labels and comments', () => {
    it('Should use the label context', () => {
      const label = 'Irish label string'
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)
        .addLabel('ga', label)

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'ga')
      expect(term.label).equals(label)
    })

    it('Should use the IRI local name as English label, if needed', () => {
      const strictTerm = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)
      expect(() => strictTerm.label).to.throw(TEST_IRI, 'en', 'no values')

      const unStrictTerm = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)
      expect(unStrictTerm.label).equals('localName')

      unStrictTerm.addLabel('', 'No language value')
      expect(unStrictTerm.label).equals('No language value')

      unStrictTerm.addLabel('en', 'English language value')
      expect(unStrictTerm.label).equals('English language value')

    })

    it('Should default to English value language', () => {
      const englishLabel = 'English label...'
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)
        .addLabel('en', englishLabel)

      expect(term.asLanguage('ga').label).equals(englishLabel)
    })

    it('Should override language', () => {
      const irishLabel = 'Irish label...'
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)
        .addLabel('ga', irishLabel)

      expect(() => term.label).to.throw(TEST_IRI, 'en', 'no values')
      expect(() => term.asLanguage('fr').label)
        .to.throw(TEST_IRI, 'fr', 'no values')

      const englishLabel = 'English label...'
      term.addLabel('en', englishLabel)

      expect(term.label).equals(englishLabel)
      expect(term.asLanguage('').label).equals(englishLabel)
      expect(term.asLanguage('fr').label).equals(englishLabel)
      expect(term.asLanguage('ga').label).equals(irishLabel)

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'ga')
      expect(term.label).equals(irishLabel)
      expect(term.asLanguage('').label).equals(englishLabel)
    })

    it('Should throw if mandatory language not found and strict', () => {
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, true)
        .addLabel('en', 'Test label in English...')

      expect(() => term.mandatory.asLanguage('fr').label)
        .to.throw(TEST_IRI, 'fr', 'no values')

      expect(() => term.mandatory.comment)
        .to.throw(TEST_IRI, 'fr', 'no values')

      expect(() => term.mandatory.message)
        .to.throw(TEST_IRI, 'fr', 'no values')
    })

    it('Should return undefined if mandatory language not found and unstrict', () => {
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)
        .addLabel('en', 'Test label in English...')

      expect(term.mandatory.asLanguage('fr').label).to.be.undefined
      expect(term.mandatory.comment).to.be.undefined
      expect(term.mandatory.message).to.be.undefined
    })

    it('Should find no language as mandatory', () => {
      const term = new LitVocabTermBase(TEST_IRI, rdf, localStorage, false)
        .addLabel('', 'No language label...')

      expect(term.mandatory.asLanguage('').label)
        .equals('No language label...')
    })

    it('Should use the comment context', () => {
      const comment = 'test label string'
      const term = new LitVocabTermBase(
        'test://iri',
        rdf,
        localStorage,
        undefined).addComment('en', comment)

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.comment).equals(comment)
    })
  })

  describe('Supports messages (rdfs:literals)', () => {
    it('Should access literal definition with language from context without params', () => {
      const iri = 'test://iri'
      const term = new LitVocabTermBase(iri, rdf, localStorage, false)
        .addMessage('en', 'whatever test')
        .addMessage('es', 'test whatever in Spanish')

      expect(term.message).equals('whatever test')
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.message).equals('test whatever in Spanish')
    })

    it('Should ignore locale from our context if explicit language, with one param', () => {
      const term = new LitVocabTermBase('test://iri', rdf, localStorage, false)
        .addMessage('en', 'Params test {{0}} and {{1}}')
        .addMessage('es', 'Prueba de parámetros {{0}} y {{1}}')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.messageParams('first', 'second'))
        .equals('Prueba de parámetros first y second')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.messageParams('first', 'second'))
        .equals('Params test first and second')
    })

    it('Should ignore locale from our context if explicit language, with params', () => {
      const term = new LitVocabTermBase('test://iri', rdf, localStorage, false)
        .addMessage('en', 'Params test {{0}} and {{1}}')
        .addMessage('es', 'Prueba de parámetros {{0}} y {{1}}')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.messageParamsInLang('en', 'first', 'second'))
        .equals('Params test first and second')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.messageParamsInLang('es', 'first', 'second'))
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
})
