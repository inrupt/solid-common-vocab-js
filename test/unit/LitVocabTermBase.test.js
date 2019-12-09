require('mock-local-storage')
const rdf = require('rdf-ext')

const LitContext = require('../../src/LitContext')
const LitVocabTermBase = require('../../src/LitVocabTermBase')

const chai = require('chai')
const expect = chai.expect

describe('LitVocabTerm tests', () => {
  describe('Constructor', () => {
    it('should behave as an IRI', () => {
      const iri = 'test://iri'
      expect(new LitVocabTermBase(iri, rdf, localStorage).iri).to.equals(iri)
    })

    it('should flag local IRI name as English label', () => {
      const iri = 'test://iri#localTermName'
      expect(new LitVocabTermBase(iri, rdf, localStorage, true)
          .labelInLang('en')).to.equals('localTermName')
    })
  })

  describe('Supports labels and comments', () => {
    it('should process English label as localname', () => {
      const iri = 'test://iri#whatever'
      const term = new LitVocabTermBase(iri, rdf, localStorage, true)
      expect(term.labelInLang('en')).equals('whatever')
    })

    it('should process labels and comments', () => {
      const iri = 'test://iri#whatever'
      const term = new LitVocabTermBase(iri, rdf, localStorage)
        .addLabel('en', 'whatever')
        .addComment('en', 'User comment')

      expect(term.labelInLang('en')).equals('whatever')
      expect(term.commentInLang('en')).equals('User comment')
    })
  })

  describe('Supports labels and comments', () => {
    it('should fail if no messages', () => {
      const iri = 'test://iri'
      const term = new LitVocabTermBase(iri, rdf, localStorage)

      expect(() => term.messageInLang('en'))
        .to.throw(iri, 'skos:definition')
    })

    it('should use the label context', () => {
      const label = 'test label string'
      const term = new LitVocabTermBase(
          'test://iri',
          rdf,
          localStorage,
          undefined).addLabel('en', label)

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.label).equals(label)
    })

    it('should use the comment context', () => {
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
    it('should access literal definition with language from context without params', () => {
      const iri = 'test://iri'
        const term = new LitVocabTermBase(iri, rdf, localStorage)
        .addMessage('en', 'whatever test')
        .addMessage('es', 'test whatever in Spanish')

      expect(term.message).equals('whatever test')
      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.message).equals('test whatever in Spanish')
    })

    it('should ignore locale from our context if explicit language, with params', () => {
      const term = new LitVocabTermBase('test://iri', rdf, localStorage)
        .addMessage('en', 'Params test {{0}} and {{1}}')
        .addMessage('es', 'Prueba de parámetros {{0}} y {{1}}')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.messageParams('first', 'second'))
        .equals('Prueba de parámetros first y second')

      localStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.messageParams('first', 'second'))
        .equals('Params test first and second')
    })

    it('should ignore locale from our context if explicit language, with params', () => {
      const term = new LitVocabTermBase('test://iri', rdf, localStorage)
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
    it ('should extract correctly', () => {
      const aliceIriAsString = 'https://alice.example.org/profile#me'
      const alice = new LitVocabTermBase(aliceIriAsString, rdf, localStorage);

      expect(LitVocabTermBase.extractIriLocalName(alice)).to.equal('me')

      expect(LitVocabTermBase.extractIriLocalName(aliceIriAsString))
        .to.equal('me')

      expect(LitVocabTermBase.extractIriLocalName(
        'https://example.com/whatever')).to.equal('whatever')
    })

    it ('should throw if no local name', () => {
      expect(() => LitVocabTermBase.extractIriLocalName(
        'http://example.com-whatever')).to.throw('Expected hash')

      expect(() => LitVocabTermBase.extractIriLocalName(
        'https://example.com-whatever')).to.throw('Expected hash')
    })
  })

  describe ('is string', () => {
    it ('should determine correctly', () => {
      expect(LitVocabTermBase.isString('test user name')).to.be.true
      expect(LitVocabTermBase.isString(
        new String('test user name'))).to.be.true

      expect(LitVocabTermBase.isString(57)).to.be.false
      expect(LitVocabTermBase.isString({ })).to.be.false
    })

    it ('should determine IRI correctly', () => {
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
