'use strict'

const rdf = require('rdf-ext')

const RifMultiLingualLiteral = require('../../src/LitMultiLingualLiteral')

const chai = require('chai')
const expect = chai.expect

describe('MultiLingualLiteral tests', () => {
  const aliceIriAsString = 'http://example.org/Alice'
  const alice = rdf.namedNode(aliceIriAsString)
  
  describe('Get IRI', () => {
    it('should return correct IRI', () => {
      const iri = 'test://iri'
      expect(new RifMultiLingualLiteral(iri).getIri()).equals(iri)
    })
    
    // it('should be able to use Multi Lingual Literals in standard RifBuild methods as NamedNode', () => {
    //   const iri = 'test://iri'
    //   const term = new RifMultiLingualLiteral(iri)
    //   expect(term.value).to.deep.equal(rdf.namedNode(iri).value)
    //   const dataset = new RifBuild().addPropertyWithValue(RDFS.label, term)
    //   expect(dataset.match(null, RDFS.label, rdf.namedNode(iri)).length).to.equal(1)
    //   dataset.print('Prints out wrong cos it looks for language tag if object is not an IRI, which we are now!')
    // })
  })
  
  describe('Adding messages', () => {
    it('should fail if no language', () => {
      const iri = 'test://iri'
      expect(() => new RifMultiLingualLiteral(iri).params()).to.throw('no language')
    })
  
    it('should add message, no constructor values', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri)
      literal.addValue('es', 'whatever in Spanish').addValue('ie', 'whatever in Irish')
      expect(literal.lookupLanguage('es')).equals('whatever in Spanish')
      expect(literal.lookupLanguage('ie')).equals('whatever in Irish')
    })
  
      it('should add message, including constructor values', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri, new Map([ [ 'en', 'whatever' ] ]))
      expect(literal.lookupEnglish).equals('whatever')
      expect(literal.lookupLanguage('es')).to.be.undefined
      
      literal.addValue('es', 'whatever in Spanish').addValue('ga', 'whatever in Irish')
      expect(literal.lookupLanguage('es')).equals('whatever in Spanish')
      expect(literal.lookupLanguage('ga')).equals('whatever in Irish')
    })
  })

    // TODO: Remove this for now, as it requires RifBuild and RifQuery, which are now a 'higher' library than ours!
  // describe('Handling inputs that contain HTTP headers', () => {
  //   it('should get language tag from HTTP header', () => {
  //     const iri = 'test://iri'
  //     const literal = new RifMultiLingualLiteral(iri, new Map([['en', 'whatever'], ['fr', 'whatever in French']]))
  //
  //     // Create our inputs with a HTTP accept-language header of French.
  //     const inputs = {httpHeaders: new RifBuild().quad('https://example.com/test', `${LitUtils.prefixForHttpHeader()}accept-language`, 'fr')}
  //     expect(literal.inputs(inputs).value).to.deep.equal(rdf.literal('whatever in French', 'fr'))
  //   })
  //
  //   it('should get language tag from HTTP header, but if none default to English', () => {
  //     const iri = 'test://iri'
  //     const literal = new RifMultiLingualLiteral(iri, new Map([['en', 'whatever'], ['fr', 'whatever in French']]))
  //
  //     // With no HTTP headers, should default to English
  //     const inputs = { httpHeaders: RifBuild.empty()}
  //     expect(literal.inputs(inputs).value).to.deep.equal(rdf.literal('whatever', 'en'))
  //   })
  // })

  describe('Looking up messages', () => {
    it('should return correct IRI', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri, new Map([ [ 'en', 'whatever' ], [ 'fr', 'whatever in French' ] ]))
      expect(literal.lookupEnglish).equals('whatever')
      expect(literal.lookupLanguage('fr')).equals('whatever in French')

      expect(literal.lookupButDefaultToEnglish('es')).equals('whatever')
    })

    it('should fail if requesting string but no language', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri)
        .addValue('en', 'whatever {{0}} in English {{1}}')

      expect(() => literal.string).to.throw(iri, 'no language was specified')
    })

    it('should fail if no values at all!', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri)

      expect(() => literal.string).to.throw(iri, 'no values at all')
      expect(() => literal.lookupButDefaultToEnglish('es')).to.throw(iri, '[es]', 'no values at all')
    })

    it('should fail if requesting string with language no params', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri)
        .addValue('en', 'whatever {{0}} in English {{1}}')
  
      expect(() => literal.english.string).to.throw(iri, 'contains unexpanded parameter placeholders')
    })
  
    it('should fail if remaining unexpanded param placeholders', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri)
        .addValue('en', 'whatever {{0}} in English {{1}}')
  
      expect(() => literal.english.params('example').string).to.throw(iri, 'en', 'require [2]', 'we only received [1]')
    })
  
    it('should lookup correctly', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri)
        .addValue('en', 'whatever {{0}} in English')
        .addValue('ga', 'whatever {{1}} in Irish is backwards {{0}}')

      expect(literal.english.params('example').value).to.deep.equal(rdf.literal('whatever example in English', 'en'))
  
      expect(literal.setLanguage('ga').params('example', 'two').value).to.deep.equal(rdf.literal('whatever two in Irish is backwards example', 'ga'))

      expect(literal.setLanguage('ga').params('example', 'two').string).to.equal('whatever two in Irish is backwards example')
    })
  
    it('should lookup with no params', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri)
        .addValue('en', 'whatever in English')
        .addValue('ga', 'whatever in Irish')
    
      expect(literal.english.value).to.deep.equal(rdf.literal('whatever in English', 'en'))
      expect(literal.setLanguage('ga').string).equals('whatever in Irish')
    })
  
    it('should use English default if requested language not found', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri)
        .addValue('en', 'whatever in English')
        .addValue('ga', 'whatever in Irish')
    
      // NOTE: our result will have an 'en' tag, even though we asked for 'fr' (since we don't have a 'fr' message!).
      expect(literal.setLanguage('fr').value).to.deep.equal(rdf.literal('whatever in English', 'en'))
    })
  
    it('should use English default with params if requested language not found', () => {
      const iri = 'test://iri'
      const literal = new RifMultiLingualLiteral(iri)
        .addValue('en', 'whatever {{0}} in English')
    
      expect(literal.setLanguage('fr').params('use default').value).to.deep.equal(rdf.literal('whatever use default in English', 'en'))
    })
  })
})
