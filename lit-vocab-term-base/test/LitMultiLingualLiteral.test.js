'use strict'

require('mock-local-storage')
const rdf = require('rdf-ext')

const LitMultiLingualLiteral = require('../src/LitMultiLingualLiteral')

const chai = require('chai')
const expect = chai.expect

describe('MultiLingualLiteral tests', () => {
  const TEST_IRI = 'test://iri#localName'

  describe('Get IRI', () => {
    it('Should return correct IRI', () => {
      expect(new LitMultiLingualLiteral(rdf, TEST_IRI).getIri())
        .equals(TEST_IRI)
    })
  })
  
  describe('Adding messages', () => {
    it('Should fail if no language', () => {
      expect(() => new LitMultiLingualLiteral(rdf, TEST_IRI)
        .paramsInLang(false, true)).to.throw('no language')
    })
  
    it('Should add message, no constructor values', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      literal.addValue('es', 'whatever in Spanish')
        .addValue('ga', 'whatever in Irish')

      expect(literal.lookupLanguageMandatory(false, true, 'es'))
        .equals('whatever in Spanish')
      expect(literal.lookupLanguageMandatory(false, true, 'ga'))
        .equals('whatever in Irish')
    })
  
    it('Should add message, including constructor values', () => {
      const literal = new LitMultiLingualLiteral(
        rdf, TEST_IRI, new Map([ [ 'en', 'whatever' ] ]))

      expect(literal.lookupEnglish(false, true)).equals('whatever')
      expect(() => literal.lookupLanguageMandatory(false, true, 'es'))
        .to.throw(TEST_IRI, 'es', 'no values')

      literal.addValue('es', 'whatever in Spanish').addValue('ga', 'whatever in Irish')
      expect(literal.lookupLanguageMandatory(false, true, 'es'))
        .equals('whatever in Spanish')

      expect(literal.lookupLanguageMandatory(false, true, 'ga'))
        .equals('whatever in Irish')
    })
  })

  describe('Looking up messages', () => {
    it('Should return correct IRI', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI, new Map([ [ 'en', 'whatever' ], [ 'fr', 'whatever in French' ] ]))
      expect(literal.lookupEnglish(false, true)).equals('whatever')
      expect(literal.lookupLanguageMandatory(false, true, 'fr'))
        .equals('whatever in French')

      expect(literal.lookupButDefaultToEnglish(false, true, 'es'))
        .equals('whatever')
    })

    it('Should default to English if no language', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever in English')

      expect(literal.lookup(false, false, true, ''))
        .to.equal('whatever in English')
    })

    it('Should fail if no values at all!', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)

      expect(() => literal.lookup(false, true, true, 'es'))
        .to.throw(TEST_IRI, '[es]', 'no values at all')

      expect(() => literal.lookupButDefaultToEnglish(false, true, true, 'es'))
        .to.throw(TEST_IRI, '[es]', 'no values at all')
    })

    it('Should return string with param markers', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English {{1}}')
  
      expect(literal.lookup(false, true, true, 'en'))
        .to.equal('whatever {{0}} in English {{1}}')
    })
  
    it('Should fail if remaining unexpanded param placeholders', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English {{1}}')
  
      expect(() => literal.setToEnglish.params(true, true, 'example'))
        .to.throw(TEST_IRI, 'en', 'require [2]', 'we only received [1]')
    })
  
    it('Should lookup literal correctly', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English')
        .addValue('ga', 'whatever {{1}} in Irish is backwards {{0}}')

      literal.asLanguage('ga')
      expect(literal.params(true, true, true, 'example', 'two'))
        .to.deep.equal(rdf.literal('whatever two in Irish is backwards example', 'ga'))

      expect(literal.params(false, true, true, 'example', 'two'))
        .to.equal('whatever two in Irish is backwards example')

      expect(literal.setToEnglish.params(true, true, true, 'example'))
        .to.deep.equal(rdf.literal('whatever example in English', 'en'))
    })
  
    it('Should lookup with no params', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever in English')
        .addValue('ga', 'whatever in Irish')

      const result = literal.lookup(true, true, true, 'en')
      expect(result.value).to.equal('whatever in English')
      expect(result.language).to.equal('en')

      expect(literal.asLanguage('ga').lookup(false, true, true, 'ga'))
        .equals('whatever in Irish')
    })
  
    it('Should use English default if requested language not found', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever in English')
        .addValue('ga', 'whatever in Irish')
    
      // NOTE: our result will have an 'en' tag, even though we asked for 'fr'
      // (since we don't have a 'fr' message!).
      const result = literal.lookup(true, false, true, 'fr')
      expect(result.value).to.equal('whatever in English')
      expect(result.language).to.equal('en')
    })

    it('Should throw with params if requested language not found', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English')

      expect(() => literal.asLanguage('fr')
        .params(true, true, true, 'use default'))
        .to.throw(TEST_IRI, '[fr]', 'none found')
    })

    it('Should return RDF literal using current language', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English')
        .addValue('fr', 'whatever {{0}} in French')

      expect(literal.params(true, true, true, 'use default'))
        .to.deep.equal(rdf.literal('whatever use default in English', 'en'))

      literal.asLanguage('fr')
      expect(literal.params(true, true, true, 'La Vie!'))
        .to.deep.equal(rdf.literal('whatever La Vie! in French', 'fr'))
    })

    it('Should use language and params', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English')
        .addValue('fr', 'whatever {{0}} in French')

      expect(literal.paramsInLang(false, true, true, 'en', 'use default'))
        .to.equal('whatever use default in English')

      expect(literal.paramsInLang(false, true, true, 'fr', 'La Vie!'))
        .to.equal('whatever La Vie! in French')
    })
  })
})
