'use strict'

require('mock-local-storage')
const rdf = require('rdf-ext')

const LitMultiLingualLiteral = require('../src/LitMultiLingualLiteral')

const chai = require('chai')
const expect = chai.expect

describe('MultiLingualLiteral tests', () => {
  const aliceIriAsString = 'http://example.org/Alice'
  const alice = rdf.namedNode(aliceIriAsString)
  const TEST_IRI = 'test://iri#localName'

  describe('Get IRI', () => {
    it('should return correct IRI', () => {
      expect(new LitMultiLingualLiteral(rdf, TEST_IRI).getIri()).equals(TEST_IRI)
    })
  })
  
  describe('Adding messages', () => {
    it('should fail if no language', () => {
      expect(() => new LitMultiLingualLiteral(rdf, TEST_IRI).paramsInLang()).to.throw('no language')
    })
  
    it('should add message, no constructor values', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      literal.addValue('es', 'whatever in Spanish')
        .addValue('ga', 'whatever in Irish')

      expect(literal.lookupLanguageMandatory('es')).equals('whatever in Spanish')
      expect(literal.lookupLanguageMandatory('ga')).equals('whatever in Irish')
    })
  
    it('should add message, including constructor values', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI, new Map([ [ 'en', 'whatever' ] ]))
      expect(literal.lookupEnglish).equals('whatever')
      expect(() => literal.lookupLanguageMandatory('es'))
        .to.throw(TEST_IRI, 'es', 'no values')

      literal.addValue('es', 'whatever in Spanish').addValue('ga', 'whatever in Irish')
      expect(literal.lookupLanguageMandatory('es')).equals('whatever in Spanish')
      expect(literal.lookupLanguageMandatory('ga')).equals('whatever in Irish')
    })
  })

  describe('Looking up messages', () => {
    it('should return correct IRI', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI, new Map([ [ 'en', 'whatever' ], [ 'fr', 'whatever in French' ] ]))
      expect(literal.lookupEnglish).equals('whatever')
      expect(literal.lookupLanguageMandatory('fr')).equals('whatever in French')

      expect(literal.lookupButDefaultToEnglish('es')).equals('whatever')
    })

    it('should default to English if no language', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever in English')

      expect(literal.lookup).to.equal('whatever in English')
    })

    it('should fail if no values at all!', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)

      expect(() => literal.lookup).to.throw(TEST_IRI, '[es]', 'no values at all')
      expect(() => literal.lookupButDefaultToEnglish('es'))
        .to.throw(TEST_IRI, '[es]', 'no values at all')
    })

    it('should return string with param markers', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English {{1}}')
  
      expect(literal.lookup).to.equal('whatever {{0}} in English {{1}}')
    })
  
    it('should fail if remaining unexpanded param placeholders', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English {{1}}')
  
      expect(() => literal.setToEnglish.params('example'))
        .to.throw(TEST_IRI, 'en', 'require [2]', 'we only received [1]')
    })
  
    it('should lookup literal correctly', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English')
        .addValue('ga', 'whatever {{1}} in Irish is backwards {{0}}')

      literal.setLanguage('ga')
      expect(literal.asRdfLiteral.params(true, 'example', 'two'))
        .to.deep.equal(rdf.literal('whatever two in Irish is backwards example', 'ga'))

      expect(literal.params(true, 'example', 'two'))
        .to.equal('whatever two in Irish is backwards example')

      expect(literal.setToEnglish.asRdfLiteral.params(true, 'example'))
        .to.deep.equal(rdf.literal('whatever example in English', 'en'))
    })
  
    it('should lookup with no params', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever in English')
        .addValue('ga', 'whatever in Irish')
    
      expect(literal.asRdfLiteral.lookup).to.deep.equal(rdf.literal('whatever in English', 'en'))
      expect(literal.setLanguage('ga').lookup).equals('whatever in Irish')
    })
  
    it('should use English default if requested language not found', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever in English')
        .addValue('ga', 'whatever in Irish')
    
      // NOTE: our result will have an 'en' tag, even though we asked for 'fr' (since we don't have a 'fr' message!).
      expect(literal.asRdfLiteral.setLanguage('fr').lookup)
        .to.deep.equal(rdf.literal('whatever in English', 'en'))
    })

    it('should use English default with params if requested language not found', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English')

      expect(literal.setLanguage('fr').asRdfLiteral
        .params(false, 'use default'))
        .to.deep.equal(rdf.literal('whatever use default in English', 'en'))
    })

    it('should return RDF literal using current language', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English')
        .addValue('fr', 'whatever {{0}} in French')

      expect(literal.asRdfLiteral.params(true, 'use default'))
        .to.deep.equal(rdf.literal('whatever use default in English', 'en'))

      literal.setLanguage('fr')
      expect(literal.asRdfLiteral.params(true, 'La Vie!'))
        .to.deep.equal(rdf.literal('whatever La Vie! in French', 'fr'))
    })

    it('should use language and params', () => {
      const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
        .addValue('en', 'whatever {{0}} in English')
        .addValue('fr', 'whatever {{0}} in French')

      expect(literal.paramsInLang(true, 'en', 'use default'))
        .to.equal('whatever use default in English')

      expect(literal.paramsInLang(true, 'fr', 'La Vie!'))
        .to.equal('whatever La Vie! in French')
    })
  })
})
