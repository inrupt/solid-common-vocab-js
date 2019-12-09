const LitContext = require('./LitContext')
const LitTermRegistry = require('./LitTermRegistry')
const LitMultiLingualLiteral = require('./LitMultiLingualLiteral')

/**
 * Class to represent vocabulary terms. We simply extend an IRI (e.g. a
 * NamedNode in rdf-ext) to also provide commonly expected meta-data
 * associated with terms in a vocabulary, like a label and a comment (in
 * multiple-languages).
 *
 * We can also take a reference to a context storage instance, which can
 * contain various contextual information, such as the current locale, or
 * language settings for an interaction that can be used to lookup context at
 * runtime (e.g. to look up the locale for a term's label at runtime if one is
 * not specifically provided).
 */
class LitVocabTermBase {
  // We expect classes that extend this class to override these methods, and
  // quite possibly with NOOP methods, since those derived classes may
  // provide their own storage (e.g. Rdf-Ext or riflib.js). Therefore these
  // methods allow those instances to avoid duplicating this storage.
  setIri(iri) {
    this._iri = iri
  }

  getIri() {
    return this._iri
  }

  constructor (iri, rdfFactory, contextStorage, useLocalNameAsEnglishLabel) {
    this.initializer(iri, rdfFactory, contextStorage, useLocalNameAsEnglishLabel)
  }

  initializer(iri, rdfFactory, contextStorage, useLocalNameAsEnglishLabel) {
    this.setIri(iri)

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
      this._label.addValue('en', LitVocabTermBase.extractIriLocalName(iri))
    }

    Object.defineProperty(this, 'iri', {
      label: 'Accessor for label that uses our LitSessionContext instance',
      get () {
        return this.getIri()
      }
    })

    Object.defineProperty(this, 'label', {
      label: 'Accessor for label that uses our LitSessionContext instance',
      get () {
        return this.labelInLang(this._litSessionContext.getLocale())
      }
    })

    Object.defineProperty(this, 'comment', {
      label: 'Accessor for comment that uses our LitSessionContext instance',
      get () {
        return this.commentInLang(this._litSessionContext.getLocale())
      }
    })

    Object.defineProperty(this, 'message', {
      label: 'Accessor that uses our LitSessionContext instance',
      get () {
        return this.messageInLang(this._litSessionContext.getLocale())
      }
    })
  }

  addLabel (language, value) {
    this._label.addValue(language, value)
    LitTermRegistry.updateLabel(this.iri, language, value)
    return this
  }

  addComment (language, value) {
    this._comment.addValue(language, value)
    LitTermRegistry.updateComment(this.iri, language, value)
    return this
  }

  addMessage (language, value) {
    this._message.addValue(language, value)
    LitTermRegistry.updateMessage(this.iri, language, value)
    return this
  }

  labelInLang (language) {
    return this._label.lookupButDefaultToEnglish(language)
  }

  commentInLang (language) {
    return this._comment.lookupButDefaultToEnglish(language)
  }

  messageInLang (language) {
    return this._message.lookupButDefaultToEnglish(language)
  }

  messageParams (...rest) {
    return this._message.paramsInLang(this._litSessionContext.getLocale(), ...rest)
  }

  messageParamsInLang (language, ...rest) {
    return this._message.paramsInLang(language, ...rest)
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
      ? stringOrNamedNode : stringOrNamedNode.getIri()

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
  //   let result = this.lookupLang(language)
  //   if (!result) {
  //     result = this.lookupLang('en')
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
