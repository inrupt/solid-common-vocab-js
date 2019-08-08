'use strict'

const rdf = require('rdf-ext')

/**
 * Class that defines the concept of a multi-lingual literal (as in a String literal). We can add multiple values in
 * different languages, and look them up again.
 * Also supports parameterized string values (using {{0}} placeholders), for which we can provide values when looking
 * them up.
 */
class LitMultiLingualLiteral {
  constructor (iri, values, contextMessage) {
    this._iri = iri
    this._values = values ? values : new Map()
    this._contextMessage = contextMessage ? contextMessage : '<None provided>'

    // Default to English.
    this._language = 'en'

    this._expandedMessage = undefined

    // Used to flag if we want result as an RDF Literal (otherwise we get back a string!).
    this._valueAsRdfLiteral = false

    // Sets our flag to say we want our value as an RDF literal.
    Object.defineProperty(this, 'asRdfLiteral', {
      get () {
        this._valueAsRdfLiteral = true
        return this
      }
    })

    // Sets the language to 'English', but returns our current instance.
    Object.defineProperty(this, 'setToEnglish', {
      get () {
        this.setLanguage('en')
        return this
      }
    })

    // Looks up our values for English.
    Object.defineProperty(this, 'lookupEnglish', {
      get () {
        return this.returnAsStringOrRdfLiteral(this._values.get('en'))
      }
    })

    // Looks up our values for English.
    Object.defineProperty(this, 'lookup', {
      get () {
        return this.lookupButDefaultToEnglish(this._language)
      }
    })
  }
  
  getIri () {
    return this._iri
  }

  setLanguage (tag) {
    this._language = tag
    return this
  }

  addValue (locale, value) {
    this._values.set(locale, value)
    return this
  }

  /**
   * Looks up the specific language *ONLY* - i.e. it  will *NOT* fallback to English.
   *
   * @param language
   * @returns {*}
   */
  lookupLang (language) {
    return this.returnAsStringOrRdfLiteral(this._values.get(language))
  }

  /**
   * Looks up a message in the requested language, but if none found we use the English message (which our
   * code-generator enforces, so we should always have at least an English message for LIT-generated vocabs).
   *
   * NOTE: If we do use the English default, then we also reset our language tag so that if we are returning an RDF
   * literal it will contain the correct language tag (i.e. 'en'), and not the requested language that didn't exist!
   *
   * @param language The requested language (but if not found we use English and reset our language tag to 'en').
   * @returns {*}
   */
  lookupButDefaultToEnglish (language) {
    return this.returnAsStringOrRdfLiteral(this.lookupStringDefaultToEnglish(language));
  }

  /**
   * Private method that only looks up the string itself (i.e. will not attempt to wrap in an RDF literal).
   *
   * @param language
   * @returns {*}
   */
  lookupStringDefaultToEnglish(language) {
    let message = this._values.get(language)
    if (!message) {
      message = this._values.get('en')
      if (!message) {
        throw new Error(`MultiLingualLiteral lookup on term [${this._iri}] for language [${language}], but no values at all (even English) (Context: [${this._contextMessage}]).`)
      }

      this._language = 'en'
    }

    return message
  }

  params (...rest) {
    return this.paramsInLang(this._language, ...rest)
  }

    /**
   * TODO: Won't yet handle replacing multiple uses of say {{1}} in a single string, which I guess it should...!?
   *
   * @returns {*}
   */
  paramsInLang (language, ...rest) {
    if (!language) {
      throw new Error(`MultiLingualLiteral with IRI [${this._iri}] called expecting params but no language specified (Context: [${this._contextMessage}]).`)
    }
    //
    let message = this.lookupStringDefaultToEnglish(language)

    const paramsRequired = (message.split('{{').length - 1)
    if (paramsRequired !== rest.length) {
      throw new Error(`Setting parameters on LitMultiLingualLiteral with IRI [${this._iri}] and value [${message}] in language [${this._language}], but it requires [${paramsRequired}] params and we received [${rest.length}] (Context: [${this._contextMessage}]).`)
    }
    
    for (let i = 0; i < rest.length; i++) {
      const marker = `{{${i}}}`
      message = message.replace(marker, rest[i])
    }

    return this.returnAsStringOrRdfLiteral(message)
  }

  returnAsStringOrRdfLiteral (message) {
    const result = this._valueAsRdfLiteral ? rdf.literal(message, this._language) : message
    this._expandedMessage = message
    this._valueAsRdfLiteral = false // Reset our flag!
    return result
  }
}

module.exports = LitMultiLingualLiteral
