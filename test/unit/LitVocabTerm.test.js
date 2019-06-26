'use strict'

const LitContext = require('../../src/LitContext')
// const LitSessionContext = require('../../src/LitSessionContext')
const LitVocabTerm = require('../../src/LitVocabTerm')

const chai = require('chai')
const expect = chai.expect

describe('LitVocabTerm tests', () => {
  describe('Constructor', () => {
    it('should behave as an IRI', () => {
      const iri = 'test://iri'
      expect(new LitVocabTerm(iri).value).to.equals(iri)
    })

    it('should flag local IRI name as English label', () => {
      const iri = 'test://iri#localTermName'
      expect(new LitVocabTerm(iri, undefined, true).label('en')).to.equals('localTermName')
    })
  })

  describe('Supports labels and comments', () => {
    it('should process English label as localname', () => {
      const iri = 'test://iri#whatever'
      const term = new LitVocabTerm(iri, undefined, true)
      expect(term.label('en')).equals('whatever')
    })

    it('should process labels and comments', () => {
      const iri = 'test://iri#whatever'
      const term = new LitVocabTerm(iri)
        .addLabel('en', 'whatever')
        .addComment('en', 'User comment')

      expect(term.label('en')).equals('whatever')
      expect(term.comment('en')).equals('User comment')
    })
  })

  describe('Supports literals', () => {
    it('should process params on literals', () => {
      const iri = 'test://iri'
      const term = new LitVocabTerm(iri)
          .addLiteral('en', 'whatever {{0}} comment - for user {{1}}')
          .addLiteral('es', 'User {{1}} has whatever comment: {{0}}')

      expect(term.literal(new LitContext('en'), 'example', 'tommy')).equals('whatever example comment - for user tommy')
      expect(term.literal(new LitContext('es'), 'example', 'tommy')).equals('User tommy has whatever comment: example')
    })

    it('should use the locale from our LIT session context', () => {
      const iri = 'test://iri'
      const contextStorage = new LitContext.EmulateLocalStorage()

      const term = new LitVocabTerm(iri, contextStorage, undefined)
        .addLiteral('en', 'No params test')
        .addLiteral('es', 'Ninguna prueba de params')

      contextStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.useContext).equals('No params test')
      contextStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.useContext).equals('Ninguna prueba de params')
    })

    it('should use the locale from our LIT session context, with params', () => {
      const contextStorage = new LitContext.EmulateLocalStorage()

      const term = new LitVocabTerm('test://iri', contextStorage, undefined)
        .addLiteral('en', 'Params test {{0}} and {{1}}')
        .addLiteral('es', 'Prueba de parámetros {{0}} y {{1}}')

      contextStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.useContextParams('first', 'second')).equals('Params test first and second')
      contextStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.useContextParams('first', 'second')).equals('Prueba de parámetros first y second')
    })

    it('should use the label context', () => {
      const contextStorage = new LitContext.EmulateLocalStorage()

      const label = 'test label string'
      const term = new LitVocabTerm('test://iri', contextStorage, undefined).addLabel('en', label)
      contextStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.labelContext).equals(label)
    })

    it('should use the comment context', () => {
      const contextStorage = new LitContext.EmulateLocalStorage()

      const comment = 'test label string'
      const term = new LitVocabTerm('test://iri', contextStorage, undefined).addComment('en', comment)
      contextStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.commentContext).equals(comment)
    })

    it('should use the literal context', () => {
      const contextStorage = new LitContext.EmulateLocalStorage()

      const literalEnglish = 'test label string'
      const literalSpanish = '<Something in Spanish>'
      const term = new LitVocabTerm('test://iri', contextStorage, undefined)
        .addLiteral('en', literalEnglish)
        .addLiteral('es', literalSpanish)

      contextStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'en')
      expect(term.useContext).equals(literalEnglish)

      contextStorage.setItem(LitContext.CONTEXT_KEY_LOCALE, 'es')
      expect(term.useContext).equals(literalSpanish)
    })
  })

  //
  //
  // describe('Supports language from context', () => {
  //   it('should get language tag from HTTP header', () => {
  //     const iri = 'test://iri'
  //     const literal = new LitMultiLingualLiteral(iri, new Map([['en', 'whatever'], ['fr', 'whatever in French']]))
  //
  //     // Create our inputs with a HTTP accept-language header of French.
  //     const inputs = {httpHeaders: new LitBuild().quad('https://example.com/test', `${LitQueryInstance.prefixForHttpHeader()}accept-language`, 'fr')}
  //     expect(literal.inputs(inputs).literal).to.deep.equal(rdf.literal('whatever in French', 'fr'))
  //   })
  //
  //   it('should get language tag from HTTP header, but if none default to English', () => {
  //     const iri = 'test://iri'
  //     const literal = new LitMultiLingualLiteral(iri, new Map([['en', 'whatever'], ['fr', 'whatever in French']]))
  //
  //     // With no HTTP headers, should default to English
  //     const inputs = { httpHeaders: LitBuild.empty()}
  //     expect(literal.inputs(inputs).literal).to.deep.equal(rdf.literal('whatever', 'en'))
  //   })
  //
  //   it('should fail if requesting string but no language', () => {
  //     const iri = 'test://iri'
  //     const literal = new LitMultiLingualLiteral(iri)
  //       .addLiteral('en', 'whatever ${1} in English ${2}')
  //
  //     expect(() => literal.string).to.throw(iri, 'no language was specified')
  //   })
  //
  //   it('should fail if requesting string with language no params', () => {
  //     const iri = 'test://iri'
  //     const literal = new LitMultiLingualLiteral(iri)
  //       .addLiteral('en', 'whatever ${1} in English ${2}')
  //
  //     expect(() => literal.english.string).to.throw(iri, 'contains unexpanded parameter placeholders')
  //   })
  //
  //   it('should fail if remaining unexpanded param placeholders', () => {
  //     const iri = 'test://iri'
  //     const literal = new LitMultiLingualLiteral(iri)
  //       .addLiteral('en', 'whatever ${1} in English ${2}')
  //
  //     expect(() => literal.english.params('example').string).to.throw(iri, 'en', 'require [2]', 'we only received [1]')
  //   })
  //
  //   it('should lookup correctly', () => {
  //     const iri = 'test://iri'
  //     const literal = new LitMultiLingualLiteral(iri)
  //       .addLiteral('en', 'whatever ${1} in English')
  //       .addLiteral('ga', 'whatever ${2} in Irish is backwards ${1}')
  //
  //     expect(literal.english.params('example').literal).to.deep.equal(rdf.literal('whatever example in English', 'en'))
  //
  //     expect(literal.language('ga').params('example', 'two').literal).to.deep.equal(rdf.literal('whatever two in Irish is backwards example', 'ga'))
  //
  //     expect(literal.language('ga').params('example', 'two').string).to.equal('whatever two in Irish is backwards example')
  //   })
  //
  //   it('should lookup with no params', () => {
  //     const iri = 'test://iri'
  //     const literal = new LitMultiLingualLiteral(iri)
  //       .addLiteral('en', 'whatever in English')
  //       .addLiteral('ga', 'whatever in Irish')
  //
  //     expect(literal.english.literal).to.deep.equal(rdf.literal('whatever in English', 'en'))
  //     expect(literal.language('ga').string).equals('whatever in Irish')
  //   })
  //
  //   it('should use English default if requested language not found', () => {
  //     const iri = 'test://iri'
  //     const literal = new LitMultiLingualLiteral(iri)
  //       .addLiteral('en', 'whatever in English')
  //       .addLiteral('ga', 'whatever in Irish')
  //
  //     // NOTE: our result will have an 'en' tag, even though we asked for 'fr' (since we don't have a 'fr' message!).
  //     expect(literal.language('fr').literal).to.deep.equal(rdf.literal('whatever in English', 'en'))
  //   })
  //
  //   it('should use English default with params if requested language not found', () => {
  //     const iri = 'test://iri'
  //     const literal = new LitMultiLingualLiteral(iri)
  //       .addLiteral('en', 'whatever ${1} in English')
  //
  //     expect(literal.language('fr').params('use default').literal).to.deep.equal(rdf.literal('whatever use default in English', 'en'))
  //   })
  // })
})
