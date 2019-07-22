'use strict'

const LitContext = require('../../src/LitContext')
const LitVocabTerm = require('../../src/LitVocabTerm')

const chai = require('chai')
const expect = chai.expect

describe('LitVocabTerm tests', () => {
  describe('Constructor', () => {
    it('should behave as an IRI', () => {
      const iri = 'test://iri'
      expect(new LitVocabTerm(iri, localStorage).value).to.equals(iri)
    })

    it('should flag local IRI name as English label', () => {
      const iri = 'test://iri#localTermName'
      expect(new LitVocabTerm(iri, localStorage, true).labelInLang('en')).to.equals('localTermName')
    })
  })

  describe('Supports labels and comments', () => {
    it('should process English label as localname', () => {
      const iri = 'test://iri#whatever'
      const term = new LitVocabTerm(iri, localStorage, true)
      expect(term.labelInLang('en')).equals('whatever')
    })

    it('should process labels and comments', () => {
      const iri = 'test://iri#whatever'
      const term = new LitVocabTerm(iri, localStorage)
        .addLabel('en', 'whatever')
        .addComment('en', 'User comment')

      expect(term.labelInLang('en')).equals('whatever')
      expect(term.commentInLang('en')).equals('User comment')
    })
  })

  describe('Supports labels and comments', () => {
    it('should fail if no messages', () => {
      const iri = 'test://iri'
      const term = new LitVocabTerm(iri, localStorage)

      expect(() => term.messageInLang('en')).to.throw(iri, 'skos:definition')
    })

    it('should use the label context', () => {
      const label = 'test label string'
      const term = new LitVocabTerm('test://iri', localStorage, undefined).addLabel('en', label)
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.label).equals(label)
    })

    it('should use the comment context', () => {
      const comment = 'test label string'
      const term = new LitVocabTerm('test://iri', localStorage, undefined).addComment('en', comment)
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.comment).equals(comment)
    })
  })

  describe('Supports messages (rdfs:literals)', () => {
    it('should access literal definition with language from context without params', () => {
      const iri = 'test://iri'
      const term = new LitVocabTerm(iri, localStorage)
        .addMessage('en', 'whatever test')
        .addMessage('es', 'test whatever in Spanish')

      expect(term.message).equals('whatever test')
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.message).equals('test whatever in Spanish')
    })

    it('should ignore locale from our context if explicit language, with params', () => {
      const term = new LitVocabTerm('test://iri', localStorage)
        .addMessage('en', 'Params test {{0}} and {{1}}')
        .addMessage('es', 'Prueba de parámetros {{0}} y {{1}}')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.messageParams('first', 'second')).equals('Prueba de parámetros first y second')
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.messageParams('first', 'second')).equals('Params test first and second')
    })

    it('should ignore locale from our context if explicit language, with params', () => {
      const term = new LitVocabTerm('test://iri', localStorage)
        .addMessage('en', 'Params test {{0}} and {{1}}')
        .addMessage('es', 'Prueba de parámetros {{0}} y {{1}}')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.messageParamsInLang('en', 'first', 'second')).equals('Params test first and second')
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.messageParamsInLang('es', 'first', 'second')).equals('Prueba de parámetros first y second')
    })
  })
})
