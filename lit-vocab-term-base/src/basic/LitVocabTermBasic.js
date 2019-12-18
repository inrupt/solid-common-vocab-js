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
   * @param strict flag if we should be strict in throwing exceptions on
   * errors, requiring at least an English label and comment, or returning
   * 'undefined'. If not strict, we can also use the local name part of the
   * IRI as the English label if no explicit English label (or no-language
   * label) is provided
   */
  constructor (iri, contextStorage, strict) {
    super(iri, new BasicRdfFactory(), contextStorage, strict)

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
