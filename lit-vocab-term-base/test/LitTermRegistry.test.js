'use strict'

require('mock-local-storage')
const rdf = require('rdf-ext')

const LitContext = require('../src/LitContext')
const LitTermRegistry = require('../src/LitTermRegistry')
const LitVocabTermBasic = require('../src/basic/LitVocabTermBasic')

const chai = require('chai')
const expect = chai.expect

describe('LitTermRegistry tests', () => {
  beforeEach(() => localStorage.clear())

  it('should lookup registry correctly', () => {
    const iri = 'test://iri'
    new LitVocabTermBasic(iri, localStorage)
      .addLabel('Hola!', 'es')
      .addComment('Hola comment!', 'es')
      .addMessage('Hola message!', 'es')

    expect(LitTermRegistry.lookupLabel(iri, 'en')).to.be.null
    expect(LitTermRegistry.lookupLabel(iri, 'es')).to.equal('Hola!')

    expect(LitTermRegistry.lookupComment(iri, 'en')).to.be.null
    expect(LitTermRegistry.lookupComment(iri, 'es')).to.equal('Hola comment!')

    expect(LitTermRegistry.lookupMessage(iri, 'en')).to.be.null
    expect(LitTermRegistry.lookupMessage(iri, 'es')).to.equal('Hola message!')
  })

  it('should lookup using fallback language', () => {
    const iri = 'test://iri'
    const term = new LitVocabTermBasic(iri, localStorage)
        .addLabel('Hola!', 'es')

    localStorage.setItem(LitContext.CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, 'es')
    expect(LitTermRegistry.lookupLabel(iri, 'en')).to.equal('Hola!')
  });

  it('should lookup, but fail using fallback language and fine English', () => {
    const iri = 'test://iri'
    const term = new LitVocabTermBasic(iri, localStorage)
        .addLabel('Hola!', 'es')
        .addLabel('Hello there!', 'en')

    localStorage.setItem(LitContext.CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, 'de')
    expect(LitTermRegistry.lookupLabel(iri, 'fr')).to.equal('Hello there!')
  });

  it('should fail lookup in requested language, in English, and in fallback language', () => {
    const iri = 'test://iri'
    const term = new LitVocabTermBasic(iri, localStorage)
        .addLabel('Hola!', 'es')

    localStorage.setItem(LitContext.CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, 'de')
    expect(LitTermRegistry.lookupLabel(iri, 'fr')).to.be.null

    term.addLabelNoLanguage('no language provided at all!')
    expect(LitTermRegistry.lookupLabel(iri, 'fr'))
        .to.equal('no language provided at all!')
  });
})
