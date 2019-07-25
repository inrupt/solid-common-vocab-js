'use strict'

/**
 * Simple registry of terms (and their associated meta-data (like labels, comment, message)) in multiple languages.
 *
 * We use localStorage to store all term meta-data, which can only store strings (so we need to expand out the
 * meta-data for each term).
 */
class LitTermRegistry {
  static addTerm (termIri, term) {
    localStorage.setItem(termIri, JSON.stringify(term))
    return this
  }

  static lookupLabel (termIri, language) {
    return LitTermRegistry.lookupFullTerm(`${termIri}-label-${language}`)
  }

  static updateLabel (termIri, language, label) {
    localStorage.setItem(`${termIri}-label-${language}`,label)
  }

  static lookupComment (termIri, language) {
    return LitTermRegistry.lookupFullTerm(`${termIri}-comment-${language}`)
  }

  static updateComment (termIri, language, label) {
    localStorage.setItem(`${termIri}-comment-${language}`,label)
  }

  static lookupMessage (termIri, language) {
    return LitTermRegistry.lookupFullTerm(`${termIri}-message-${language}`)
  }

  static updateMessage (termIri, language, label) {
    localStorage.setItem(`${termIri}-message-${language}`,label)
  }

  static lookupFullTerm(value) {
    const result = localStorage.getItem(value)
    if (!result) {
      console.log(`Vocab term lookup not found: [${value}].`)
    }

    return result;
  }
}

module.exports = LitTermRegistry
