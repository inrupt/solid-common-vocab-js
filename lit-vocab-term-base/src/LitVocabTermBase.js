'use strict'

const LitContext = require('./LitContext')
const LitTermRegistry = require('./LitTermRegistry')
const LitMultiLingualLiteral = require('./LitMultiLingualLiteral')

/**
 * Class to represent vocabulary terms. We expect derived classes to extend
 * an IRI (e.g. a NamedNode in RDFJS), but we just provide effectively an
 * abstract base class providing meta-data associated with terms in a
 * vocabulary, like labels and comments (in multiple-languages).
 *
 * We can also take a reference to a context storage instance, which can
 * contain various contextual information, such as the current locale, or
 * language settings for an interaction that can be used to lookup context at
 * runtime (e.g. to look up the locale for a term's label at runtime if one is
 * not explicitly asked for).
 *
 * NOTE: Since this class does NOT actually store the IRI value for vocab
 * term (since we expect derived classes to provide that), testing this
 * class in isolation will result in strange looking (i.e. 'undefined-'
 * prefixed) key values in 'localStorage' since we create those keys based on
 * the term IRI (that we don't store!). Currently this doesn't cause any
 * problems, but it's just something to be aware of!
 */
class LitVocabTermBase {
  /**
   * Constructor.
   *
   * @param iri the IRI for this vocabulary term
   * @param rdfFactory an underlying RDF library that can create IRI's
   * @param contextStorage context for this term
   * @param useLocalNameAsEnglishLabel flag if we should use local name as
   * English label or not.
   */
  constructor (iri, rdfFactory, contextStorage, useLocalNameAsEnglishLabel) {
    this.initializer(iri, rdfFactory, contextStorage, useLocalNameAsEnglishLabel)
  }

  /**
   * Called from the 'aggregator' implementation as if it were a constructor...
   *
   * @param iri the IRI for this vocabulary term
   * @param rdfFactory an underlying RDF library that can create IRI's
   * @param contextStorage context for this term
   * @param useLocalNameAsEnglishLabel flag if we should use local name as
   * English label or not.
   * @returns {*}
   */
  initializer(iri, rdfFactory, contextStorage, useLocalNameAsEnglishLabel) {
    this._litSessionContext = new LitContext('en', contextStorage)

    // Create holders for meta-data on this vocabulary term (we could probably
    // lazily create these only if values are actually provided!).
    this._label = new LitMultiLingualLiteral(
        rdfFactory,
        iri,
        undefined,
        'rdfs:label')

    this._comment = new LitMultiLingualLiteral(
        rdfFactory,
        iri,
        undefined,
        'rdfs:comment')

    this._message = new LitMultiLingualLiteral(
        rdfFactory,
        iri,
        undefined,
        'message (should be defined in RDF vocab using: skos:definition)')

    LitTermRegistry.addTerm(iri, this)

    if (useLocalNameAsEnglishLabel) {
      // This can be overwritten if we get an actual English label later, which
      // would be fine.
      this._label.addValue('', LitVocabTermBase.extractIriLocalName(iri))
    }

    this.resetState();

    Object.defineProperty(this, 'dontThrow', {
      label: 'Set a flag to return undefined instread of any exceptions',
      get () {
        this._dontThrow = true
        return this
      }
    })

    Object.defineProperty(this, 'mandatory', {
      label: 'Set our mandatory flag - i.e. throws if not as expected',
      get () {
        this._mandatory = true
        return this
      }
    })

    Object.defineProperty(this, 'asEnglish', {
      label: 'Simple convenience accessor for requesting English',
      get () {
        return this.asLanguage('en')
      }
    })

    Object.defineProperty(this, 'label', {
      label: 'Accessor for label that uses our LitSessionContext instance',
      get () {
        try {
          const result = this.labelInLang(this._litSessionContext.getLocale())
          return result
        } finally {
          this.resetState()
        }
      }
    })

    Object.defineProperty(this, 'comment', {
      label: 'Accessor for comment that uses our LitSessionContext instance',
      get () {
        const result = this.commentInLang(this._litSessionContext.getLocale())
        this.resetState()
        return result
      }
    })

    Object.defineProperty(this, 'message', {
      label: 'Accessor for message that uses our LitSessionContext instance',
      get () {
        const result = this.messageInLang(this._litSessionContext.getLocale())
        this.resetState()
        return result
      }
    })
  }

  resetState() {
    this._languageOverride = undefined
    this._mandatory = false
    this._dontThrow = false
  }

  addLabel (language, value) {
    this._label.addValue(language, value)
    LitTermRegistry.updateLabel(this.value, language, value)
    return this
  }

  addComment (language, value) {
    this._comment.addValue(language, value)
    LitTermRegistry.updateComment(this.value, language, value)
    return this
  }

  addMessage (language, value) {
    this._message.addValue(language, value)
    LitTermRegistry.updateMessage(this.value, language, value)
    return this
  }

  useLanguageOverrideOrGetFromContext () {
    return this._languageOverride === undefined
      ? this._litSessionContext.getLocale() : this._languageOverride
  }

  asLanguage(language) {
    this._languageOverride = language
    return this
  }

  labelInLang (language) {
    const lookupLanguage = this.useLanguageOverrideOrGetFromContext(language)
    return this._mandatory
      ? this._label.lookupLanguageMandatory(lookupLanguage)
      : this._label.lookupButDefaultToEnglish(lookupLanguage)
  }

  commentInLang (language) {
    const lookupLanguage = this.useLanguageOverrideOrGetFromContext(language)
    return this._mandatory
      ? this._comment.lookupLanguageMandatory(lookupLanguage)
      : this._comment.lookupButDefaultToEnglish(lookupLanguage)
  }

  messageInLang (language) {
    const lookupLanguage = this.useLanguageOverrideOrGetFromContext(language)
    return this._mandatory
      ? this._message.lookupLanguageMandatory(lookupLanguage)
      : this._message.lookupButDefaultToEnglish(lookupLanguage)
  }

  messageParams (...rest) {
    return this._message.paramsInLang(
      this._mandatory, this._litSessionContext.getLocale(), ...rest)
  }

  messageParamsInLang (language, ...rest) {
    return this._message.paramsInLang(this._mandatory, language, ...rest)
  }

  /**
   * Extract the local name from the specified IRI (can be a primitive string or
   * a NamedNode).
   *
   * @param stringOrNamedNode The IRI to extract from.
   * @returns {string}
   */
  static extractIriLocalName (stringOrNamedNode) {
    const iri = this.isString(stringOrNamedNode)
      ? stringOrNamedNode : stringOrNamedNode.value

    const hashPos = iri.lastIndexOf('#')
    if (hashPos === -1) {
      const lastSlashPos = iri.lastIndexOf('/')
      if ((lastSlashPos === -1) ||
        (iri.toLowerCase().startsWith('http') &&
          (lastSlashPos < (iri.toLowerCase().startsWith('https') ? 8 : 7)))) {
        throw Error(`Expected hash fragment ('#') or slash ('/') (other than 'https://...') in IRI [${iri}]`)
      }

      return iri.substring(lastSlashPos + 1)
    }

    return iri.substring(hashPos + 1)
  }

  /**
   * Simple method to determine if the specified value is a primitive String.

   * @param value The value to evaluate.
   * @returns {boolean} true if String, else false.
   */
  static isString (value) {
    return ((typeof value === 'string') || (value instanceof String))
  }

  /**
   * Simply treat the value as an IRI if it starts with 'http://' or 'https://'
   * (case-insensitive).
   *
   * @param value
   * @returns {boolean}
   */
  static isStringIri (value) {
    if (! this.isString(value)) {
      return false;
    }

    const valueLower = value.toLowerCase()
    return (valueLower.startsWith('http://') || valueLower.startsWith('https://'))
  }

  // /**
  //  * Processes the specified inputs to extract any possible contextual information to help subsequent lookups. For
  //  * instance, we can look for the 'accept-language' HTTP header to set our language tag, or use session information to
  //  * determine privileges to certain languages!
  //  *
  //  * NOTE: If no 'accept-language' header, then we default language to English. We do this since we assume most
  //  * requests won't set this header, but we don't want to overload the programmer to have to explicitly provide a
  //  * default language too. (We could rename this method to 'inputsDefaultEnglish()' or something, but that seems
  //  * overkill.)
  //  *
  //  * @param inputs
  //  * @returns {LitMultiLingualLiteral}
  //  */
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
  //
  // /**
  //  * Looks up a message in the request language, but if none found we use the English message (which our code-generator
  //  * enforces, so we should always have at least an English message).
  //  *
  //  * NOTE: If we do use the English default, then we also reset our language tag so that if we are returning an RDF
  //  * literal, it will contain the correct language tag (i.e. 'en'), and not the requested language that didn't exist!
  //  *
  //  * @param language The requested language (but if not found we use English and reset our language tag to 'en').
  //  * @returns {*}
  //  */
  // lookupButDefaultToEnglish (language) {
  //   let result = this.lookupLanguageMandatory(language)
  //   if (!result) {
  //     result = this.lookupLanguageMandatory('en')
  //     this._language = 'en'
  //   }
  //
  //   return result
  // }
  //
  // /**
  //  * TODO: Won't yet handle replacing multiple uses of say ${1}, which I guess it should...!?
  //  *
  //  * @returns {*}
  //  */
  // params () {
  //   if (!this._language) {
  //     throw new Error(`MultiLingualLiteral called with params [${arguments}] but no language specified.`)
  //   }
  //
  //   let message = this.lookupButDefaultToEnglish(this._language)
  //
  //   const paramsRequired = (message.split('${').length - 1)
  //   if (paramsRequired !== arguments.length) {
  //     throw new Error(`Setting parameters on LitMultiLingualLiteral with IRI [${this._iri}] in language [${this._language}], but it requires [${paramsRequired}] params and we received [${arguments.length}].`)
  //   }
  //
  //   for (let i = 0; i < arguments.length; i++) {
  //     const marker = `${(i + 1)}`
  //     message = message.replace('${' + marker + '}', arguments[i])
  //   }
  //
  //   this._expandedMessage = message
  //
  //   return this
  // }
}

module.exports = LitVocabTermBase
