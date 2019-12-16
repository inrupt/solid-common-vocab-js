'use strict'

const LitVocabTermBase = require('../LitVocabTermBase')
const BasicRdfFactory = require('./BasicRdfFactory')

/**
 * A very basic implementation for the LIT Vocab Term that doesn't require
 * any RDF libraries at all.
 */
class LitVocabTermBasic extends LitVocabTermBase {
  /**
   * Constructor.
   *
   * @param iri the IRI for this vocabulary term
   * @param contextStorage context for this term
   * @param useLocalNameAsEnglishLabel flag if we should use local name as
   * English label or not.
   */
  constructor (iri, contextStorage, useLocalNameAsEnglishLabel) {
    super(iri, new BasicRdfFactory(), contextStorage, useLocalNameAsEnglishLabel)

    this._iri = iri

    Object.defineProperty(this, 'value', {
      label: 'Accessor for our IRI value',
      get () {
        return this._iri
      }
    })
  }
}

module.exports = LitVocabTermBasic
