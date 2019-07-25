'use strict'

/**
 * Simple registry of terms (and their associated meta-data (like labels, comment, message) in mutliple languages.
 */
class LitTermRegistry {
  static addTerm (termIri, term) {
    localStorage.setItem(termIri, JSON.stringify(term))
    return this
  }

  static lookupLabel (termIri, language) {
    return localStorage.getItem(`${termIri}-label-${language}`)
  }

  static updateLabel (termIri, language, label) {
    localStorage.setItem(`${termIri}-label-${language}`,label)
  }

  static lookupComment (termIri, language) {
    return localStorage.getItem(`${termIri}-comment-${language}`)
  }

  static updateComment (termIri, language, label) {
    localStorage.setItem(`${termIri}-comment-${language}`,label)
  }

  static lookupMessage (termIri, language) {
    return localStorage.getItem(`${termIri}-message-${language}`)
  }

  static updateMessage (termIri, language, label) {
    localStorage.setItem(`${termIri}-message-${language}`,label)
  }
}

module.exports = LitTermRegistry
