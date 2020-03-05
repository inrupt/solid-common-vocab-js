"use strict";

const LitVocabTermBase = require("../LitVocabTermBase");
const BasicRdfFactory = require("./BasicRdfFactory");

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
   * @param strict flag if we should be strict. If not strict, we can use the
   * path component of the term's IRI as the English label if no explicit
   * English label (or no-language label) is provided, e.g. 'name' for the
   * term 'http://example.com/vocab#name'.
   */
  constructor(iri, contextStorage, strict) {
    super(iri, new BasicRdfFactory(), contextStorage, strict);

    this._iri = iri;

    Object.defineProperty(this, "value", {
      label: "Accessor for our IRI value",
      get() {
        return this._iri;
      }
    });
  }
}

module.exports = LitVocabTermBasic;
