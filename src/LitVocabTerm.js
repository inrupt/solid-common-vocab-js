'use strict'

const rdf = require('rdf-ext')

const LitContext = require('./LitContext')
const LitMultiLingualLiteral = require('./LitMultiLingualLiteral')
const LitUtils = require('./LitUtils')

/**
 * Class to represent vocabulary terms. We simply extend an IRI (i.e. a NamedNode in rdf-ext) to also provide commonly
 * expected meta-data associated with terms in a vocabulary, like a label and a comment (in multiple-languages).
 *
 * We can also take a reference to a context storage instance, which can contain various contextual information, such
 * as the current locale, or language settings for an interaction that can be used to lookup context at runtime (e.g.
 * to look up the locale for a term's label at runtime if one is not specifically provided).
 */
class LitVocabTerm extends rdf.defaults.NamedNode  {
  constructor (iri, contextStorage, useLocalNameAsEnglishLabel) {
    super(iri)

    this._litSessionContext = new LitContext('en', contextStorage)

    // Create holders for meta-data on this vocabulary term (we could probably lazily create these only if values
    // are actually provided!).
    this._label = new LitMultiLingualLiteral(iri, undefined, 'rdfs:label')
    this._comment = new LitMultiLingualLiteral(iri, undefined, 'rdfs:comment')
    this._message = new LitMultiLingualLiteral(iri, undefined, 'message (should be defined in RDF vocab using: skos:definition)')

    if (useLocalNameAsEnglishLabel) {
      this._label.addValue('en', LitUtils.extractIriLocalName(iri))
    }

    Object.defineProperty(this, 'useContext', {
      label: 'Accessor that uses our LitSessionContext instance',
      get () {
        return this.message(this._litSessionContext)
      }
    })

    Object.defineProperty(this, 'labelContext', {
      label: 'Accessor for label that uses our LitSessionContext instance',
      get () {
        return this.label(this._litSessionContext.getLocale())
      }
    })

    Object.defineProperty(this, 'commentContext', {
      label: 'Accessor for comment that uses our LitSessionContext instance',
      get () {
        return this.comment(this._litSessionContext.getLocale())
      }
    })

    Object.defineProperty(this, 'messageContext', {
      label: 'Accessor that uses our LitSessionContext instance',
      get () {
        return this.message(this._litSessionContext)
      }
    })
  }

  useContextParams (...rest) {
    return this.message(this._litSessionContext, ...rest)
  }

  addLabel (language, value) {
    this._label.addValue(language, value)
    return this
  }

  addComment (language, value) {
    this._comment.addValue(language, value)
    return this
  }

  addMessage (language, value) {
    this._message.addValue(language, value)
    return this
  }

  label (language) {
    return this._label.lookupLanguage(language)
  }

  comment (language) {
    return this._comment.lookupLanguage(language)
  }

  message (context, ...rest) {
    return this._message.setLanguage(context.getLocale()).params(...rest).string
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
  //   let result = this.lookupLanguage(language)
  //   if (!result) {
  //     result = this.lookupLanguage('en')
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

module.exports = LitVocabTerm
