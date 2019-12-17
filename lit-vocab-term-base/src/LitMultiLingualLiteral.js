'use strict'

const debug = require('debug')('lit-vocab-term:LitMultiLingualLiteral');

/**
 * Class that defines the concept of a multi-lingual literal (as in a String
 * literal). We can add multiple values in different languages, and look them
 * up again.
 * Also supports parameterized string values (using {{0}} placeholders), for
 * which we can provide values when looking them up.
 */
class LitMultiLingualLiteral {
  /**
   *
   * @param rdfFactory Expected to provide RDF primitives (e.g. named nodes,
   * literals, etc.).
   * @param iri The IRI for this instance
   * @param values The values (if any) to initialise this instance
   * @param contextMessage Context information (helpful for debugging)
   * @returns {LitMultiLingualLiteral|*}
   */
  constructor (rdfFactory, iri, values, contextMessage) {
    this._rdfFactory = rdfFactory
    this._iri = iri
    this._values = values ? values : new Map()
    this._contextMessage = contextMessage ? contextMessage : '<None provided>'

    // Default to English.
    this._language = 'en'

    this._expandedMessage = undefined

    // Sets the language to 'English', but returns our current instance.
    Object.defineProperty(this, 'setToEnglish', {
      get () {
        this.asLanguage('en')
        return this
      }
    })
  }

  lookupEnglish(asRdfLiteral, throwOnError) {
    return this.lookupButDefaultToEnglish(asRdfLiteral, throwOnError, 'en')
  }

  getIri () {
    return this._iri
  }

  asLanguage (tag) {
    this._language = tag
    return this
  }

  addValue (locale, value) {
    this._values.set(locale, value)
    return this
  }

  lookup (asRdfLiteral, mandatory, throwOnError, language) {
    return mandatory
      ? this.lookupLanguageMandatory(asRdfLiteral, throwOnError, language)
      : this.lookupButDefaultToEnglish(asRdfLiteral, throwOnError, language)
  }

  /**
   * Looks up the specific language *ONLY* - i.e. it  will *NOT* fallback to
   * English.
   *
   * @param language
   * @returns {*}
   */
  lookupLanguageMandatory (asRdfLiteral, throwOnError, language) {
    const message = this.lookupMandatory(throwOnError, language)
    return this.returnAsStringOrRdfLiteral(asRdfLiteral, message)
  }

  /**
   * Looks up a message in the requested language, but if none found we use the
   * English message (which our code-generator enforces, so we should always
   * have at least an English message for LIT-generated vocabs).
   *
   * NOTE: If we do use the English default, then we also reset our language
   * tag so that if we are returning an RDF literal it will contain the correct
   * language tag (i.e. 'en'), and not the requested language that didn't exist!
   *
   * @param language The requested language (but if not found we use English
   * and reset our language tag to 'en').
   * @returns {*}
   */
  lookupButDefaultToEnglish (asRdfLiteral, throwOnError, language) {
    return this.returnAsStringOrRdfLiteral(
      asRdfLiteral,
      this.lookupButDefaultToEnglishOrNoLanguage(throwOnError, language)
    );
  }

  /**
   * Handle errors - we'll throw an error (with the specified message) unless
   * we're told not to throw an exception, in which case we return 'undefined'
   * instead.
   *
   * @param throwOnError Flag if true we return undefined, else we throw an error
   * @param message the message to throw (we also write to 'debug')
   * @returns {undefined} an Error or undefined if no exceptions...
   */
  handleError(throwOnError, message) {
    debug(message)

    if (throwOnError) {
      throw new Error(message)
    }

    return undefined
  }

  /**
   * Private method that only looks up the string itself (i.e. will not attempt
   * to wrap in an RDF literal).
   *
   * @param language
   * @returns {*}
   */
  lookupButDefaultToEnglishOrNoLanguage(throwOnError, language) {
    let message = this._values.get(language)
    if (!message) {
      message = this._values.get('en')
      if (message) {
        this._language = 'en'
      } else {
        message = this._values.get('')
        if (!message) {
          return this.handleError(
            throwOnError,
            `MultiLingualLiteral lookup on term [${this._iri}] for language [${language}], but no values at all (even English, or no language tag at all) (Context: [${this._contextMessage}]).`)
        }

        this._language = ''
      }
    }

    return message
  }

  params (asRdfLiteral, throwOnError, mandatory, ...rest) {

    return this.paramsInLang(
      asRdfLiteral,
      throwOnError,
      mandatory,
      this._language,
      ...rest)
  }

  lookupMandatory(throwOnError, language) {
    const result = this._values.get(language)
    if (!result) {
      return this.handleError(
        throwOnError,
        `MultiLingualLiteral message with IRI [${this._iri}] required value in language [${language}], but none found (Context: [${this._contextMessage}]).`)
    }

    return result
  }

  /**
   * TODO: Won't yet handle replacing multiple uses of say {{1}} in a single
   *  string, which I guess it should...!?
   *
   * @returns {*}
   */
  paramsInLang (asRdfLiteral, throwOnError, mandatory, language, ...rest) {
    if (!language) {
      return this.handleError(
        throwOnError,
        `MultiLingualLiteral with IRI [${this._iri}] called expecting params but no language specified (Context: [${this._contextMessage}]).`)
    }

    let message = mandatory
      ? this.lookupMandatory(throwOnError, language)
      : this.lookupButDefaultToEnglishOrNoLanguage(throwOnError, language)

    const paramsRequired = (message.split('{{').length - 1)
    if (paramsRequired !== rest.length) {
      return this.handleError(
        throwOnError,
        `Setting parameters on LitMultiLingualLiteral with IRI [${this._iri}] and value [${message}] in language [${this._language}], but it requires [${paramsRequired}] params and we received [${rest.length}] (Context: [${this._contextMessage}]).`)
    }
    
    for (let i = 0; i < rest.length; i++) {
      const marker = `{{${i}}}`
      message = message.replace(marker, rest[i])
    }

    return this.returnAsStringOrRdfLiteral(asRdfLiteral, message)
  }

  returnAsStringOrRdfLiteral (asRdfLiteral, message) {
    const result = asRdfLiteral
        ? this._rdfFactory.literal(message, this._language) : message

    this._expandedMessage = message
    return result
  }
}

module.exports = LitMultiLingualLiteral
