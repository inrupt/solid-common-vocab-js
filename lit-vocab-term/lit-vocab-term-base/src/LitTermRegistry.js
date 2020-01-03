'use strict'

const debug = require('debug')('lit-vocab-term:LitTermRegistry');

const LitContext = require('./LitContext')
const LitMultiLingualLiteral = require('./LitMultiLingualLiteral')

/**
 * Simple registry of terms (and their associated meta-data (like labels,
 * comment, message)) in multiple languages.
 *
 * We use localStorage to store all term meta-data, which can only store
 * strings (so we need to expand out the meta-data for each term).
 */
class LitTermRegistry {
  static addTerm (termIri, term) {
    localStorage.setItem(termIri, JSON.stringify(term))
    return this
  }

  static lookupLabel (termIri, language) {
    return LitTermRegistry.lookupFullTerm(`${termIri}-label-`, language)
  }

  static updateLabel (termIri, language, label) {
    localStorage.setItem(`${termIri}-label-${language}`,label)
  }

  static lookupComment (termIri, language) {
    return LitTermRegistry.lookupFullTerm(`${termIri}-comment-`, language)
  }

  static updateComment (termIri, language, label) {
    localStorage.setItem(`${termIri}-comment-${language}`,label)
  }

  static lookupMessage (termIri, language) {
    return LitTermRegistry.lookupFullTerm(`${termIri}-message-`, language)
  }

  static updateMessage (termIri, language, label) {
    localStorage.setItem(`${termIri}-message-${language}`,label)
  }

  /**
   * Looks up the specified vocabulary term in the specified language. If no
   * value found, will lookup again using the fallback language (as set in our
   * context). If not found again, will fallback to looking up the term in
   * English.
   *
   * @param term
   * @param language
   * @returns {string}
   */
  static lookupFullTerm(term, language) {
    let result = localStorage.getItem(`${term}${language}`)
    if (!result) {
        const fallbackLanguage = localStorage.getItem(LitContext.CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE);
      if (fallbackLanguage) {
        result = localStorage.getItem(`${term}${fallbackLanguage}`)
      }

      if (result) {
        debug(`Vocab term [${term}] found value [${result}] using preferred fallback language [${fallbackLanguage}].`)
      } else {
        result = localStorage.getItem(`${term}en`)
        if (result) {
          debug(`Vocab term [${term}] found value [${result}] using English instead of explicitly requested [${language}].`)
        } else {
          result = localStorage.getItem(`${term}${LitMultiLingualLiteral.NO_LANGUAGE_TAG}`)

          if (!result) {
            debug(`Vocab term lookup not found: [${term}] for explicit language [${language}], nor fallback [${fallbackLanguage}], English, or no specific language!.`)
          }
        }
      }
    }

    return result;
  }
}

module.exports = LitTermRegistry
