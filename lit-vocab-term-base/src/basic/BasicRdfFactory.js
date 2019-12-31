'use strict'

/**
 * A very simple RDF factory that provides simple implementations of the
 * RDFJS methods our LIT Vocab Term needs.
 *
 * TODO: We should depend on the actual RDFJS interfaces, but I think
 *  they're TypeScript, and so we need to migrate to that ourselves first!
 */
class BasicRdfFactory {
  /**
   *
   * @param literalValue
   * @param languageOrDatatype
   * @returns {{language: *, value: *}}
   */
  literal (literalValue, languageOrDatatype) {
    // TODO: Only simple language tag support for now (i.e. no datatypes),
    //  and only returns a simple Javascript object, not an RDFJS 'Literal'...
    return {
      // '@context': '<Map terms to IRIs>',
      value: literalValue,
      datatype: {
        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString'
      },
      language: languageOrDatatype
    }
  }
}

module.exports = BasicRdfFactory
