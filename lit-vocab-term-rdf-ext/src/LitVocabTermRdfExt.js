'use strict'

const rdf = require('rdf-ext')

const LitVocabTermBase = require('../lit-vocab-term-base/src/LitVocabTermBase')

const aggregation = require("aggregation/es6")

/**
 * Provides an Rdf-Ext-specific LIT Vocab Term implementation.
 * This class uses aggregation as a form of multiple-inheritance to allow it
 * be used both as a LIT Vocab Term (that has awareness of rdfs:label,
 * rdfs:comment and context-awareness of local storage to retrieve current
 * user language settings, for instance), and also to be a fundamental Named
 * Node that allows us use it directly in methods from our underlying RDF
 * library.
 */
class LitVocabTermRdfExt
    extends aggregation(rdf.defaults.NamedNode, LitVocabTermBase) {

    /**
     * Our Named Node only needs the first parameter, but our LIT Vocab Term
     * can take a context storage (e.g. localStorage on a browser) too.
     *
     * @param iri the IRI for this vocabulary term
     * @param contextStorage optional context storage (e.g. localStorage)
     * name part of the IRI as the English label.
     * @param strict flag if we should be strict in throwing exceptions on
     * errors, requiring at least an English label and comment, or returning
     * 'undefined'. If not strict, we can also use the local name part of the
     * IRI as the English label if no explicit English label (or no-language
     * label) is provided
     */
    constructor (iri, contextStorage, strict) {
        super(iri, rdf, contextStorage, strict)
    }

    /**
     * This method allows us override the base class implementation of
     * storing the actual IRI.
     *
     * @param iri the IRI for this vocabulary term
     * @returns {LitVocabTermRdfExt}
     */
    setIri(iri) {
        // NOOP - our constructor stores the IRI.
        return this
    }

    /**
     * Returns the IRI for this vocabulary term.
     *
     * @returns iri the IRI for this vocabulary term
     */
    getIri() {
        return this.value
    }
}

module.exports = LitVocabTermRdfExt
