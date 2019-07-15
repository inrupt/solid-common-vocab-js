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
  
    this._language = undefined
    this._expandedMessage = undefined
  
    Object.defineProperty(this, 'string', {
      get () {
        if (!this._language) {
          throw new Error(`Requested LitMultiLingualLiteral with IRI [${iri}], but no language was specified (Context: [${this._contextMessage}]).`)
        }
        
        let result
        if (!this._expandedMessage) {
          const message = this.lookupButDefaultToEnglish(this._language)
          
          if (message.indexOf('{{') !== -1) {
            throw new Error(`Requested LitMultiLingualLiteral with IRI [${iri}] in language [${this._language}], but it still contains unexpanded parameter placeholders (please use the .params() method to provide *all* required parameter values) (Context: [${this._contextMessage}]).`)
          }
          
          result = message
        } else {
          result = this._expandedMessage
        }
        
        return result
      }
    })

    // Returns an RDF literal based on our current criteria.
    Object.defineProperty(this, 'value', {
      get () {
        const message = this.string
        return rdf.literal(message, this._language)
      }
    })

    // Sets the language to 'English', but returns our current instance.
    Object.defineProperty(this, 'english', {
      get () {
        this.setLanguage('en')
        return this
      }
    })

    // Looks up our values for English.
    Object.defineProperty(this, 'lookupEnglish', {
      get () {
        return this._values.get('en')
      }
    })
  }
  
  getIri () {
    return this._iri
  }
  
  addValue (locale, value) {
    this._values.set(locale, value)
    return this
  }

  lookupLanguage (locale) {
    return this._values.get(locale)
  }
  
  setLanguage (tag) {
    this._language = tag
    return this
  }
  
  /**
   * Processes the specified inputs to extract any possible contextual information to help subsequent lookups. For
   * instance, we can look for the 'accept-language' HTTP header to set our language tag, or use session information to
   * determine privileges to certain languages!
   *
   * NOTE: If no 'accept-language' header, then we default language to English. We do this since we assume most
   * requests won't set this header, but we don't want to overload the programmer to have to explicitly provide a
   * default language too. (We could rename this method to 'inputsDefaultEnglish()' or something, but that seems
   * overkill.)
   *
   * @param inputs
   * @returns {LitMultiLingualLiteral}
   */
  // TODO: Remove this for now, as it depends on LitBuild and LitQuery functionality, which are now 'above' this library...
  // inputs (inputs) {
  //   const acceptLanguage = inputs.httpHeaders.query.lookupHttpHeader('accept-language')
  //   if (acceptLanguage) {
  //     this._language = acceptLanguage
  //   } else {
  //     this._language = 'en'
  //   }
  //
  //   return this
  // }
  
  /**
   * Looks up a message in the request language, but if none found we use the English message (which our code-generator
   * enforces, so we should always have at least an English message).
   *
   * NOTE: If we do use the English default, then we also reset our language tag so that if we are returning an RDF
   * literal, it will contain the correct language tag (i.e. 'en'), and not the requested language that didn't exist!
   *
   * @param language The requested language (but if not found we use English and reset our language tag to 'en').
   * @returns {*}
   */
  lookupButDefaultToEnglish (language) {
    let result = this.lookupLanguage(language)
    if (!result) {
      result = this.lookupLanguage('en')
      if (!result) {
        throw new Error(`MultiLingualLiteral lookup on term [${this._iri}] for language [${language}], but no values at all (even English) (Context: [${this._contextMessage}]).`)
      }

      this._language = 'en'
    }
    
    return result
  }
  
  /**
   * TODO: Won't yet handle replacing multiple uses of say {{1}} in a single string, which I guess it should...!?
   *
   * @returns {*}
   */
  params () {
    if (!this._language) {
      throw new Error(`MultiLingualLiteral called with params [${arguments}] but no language specified.`)
    }
  
    let message = this.lookupButDefaultToEnglish(this._language)
    
    const paramsRequired = (message.split('{{').length - 1)
    if (paramsRequired !== arguments.length) {
      throw new Error(`Setting parameters on LitMultiLingualLiteral with IRI [${this._iri}] in language [${this._language}], but it requires [${paramsRequired}] params and we received [${arguments.length}] (Context: [${this._contextMessage}]).`)
    }
    
    for (let i = 0; i < arguments.length; i++) {
      const marker = `{{${i}}}`
      message = message.replace(marker, arguments[i])
    }

    this._expandedMessage = message
    
    return this
  }
}

module.exports = LitMultiLingualLiteral
