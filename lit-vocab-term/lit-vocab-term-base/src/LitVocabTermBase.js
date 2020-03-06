"use strict";

const LitContext = require("./LitContext");
const LitTermRegistry = require("./LitTermRegistry");
const LitMultiLingualLiteral = require("./LitMultiLingualLiteral");

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
 * This Turtle snippet may help illustrate what this class supports:
 *
 *   prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
 *   prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
 *   prefix skos:     <http://www.w3.org/2004/02/skos/core#>
 *   prefix ex:   <http://example.com/>
 *
 *   ex:name a rdf:Property ;
 *     rdfs:label "Name" ;
 *     rdfs:label "First name"@en ;
 *     rdfs:label "Nombre"@es ;
 *     rdfs:comment "A person's first name"@en .
 *
 *   ex:errNameTooLong a rdfs:Literal ;
 *     skos:definition "Name must be less than {{0}}, but we got {{1}}"@en .
 *
 * NOTE: Since this class does NOT actually store the IRI value for the vocab
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
   * @param strict flag if we should be strict. If not strict, we can use the
   * path component of the term's IRI as the English label if no explicit
   * English label (or no-language label) is provided, e.g. 'name' for the
   * term 'http://example.com/vocab#name'.
   */
  constructor(iri, rdfFactory, contextStorage, strict) {
    this.initializer(iri, rdfFactory, contextStorage, strict);
  }

  /**
   * Called from the 'aggregator' implementation as if it were a constructor...
   *
   * @param iri the IRI for this vocabulary term
   * @param rdfFactory an underlying RDF library that can create IRI's
   * @param contextStorage context for this term
   * @param strict flag if we should be strict. If not strict, we can use the
   * path component of the term's IRI as the English label if no explicit
   * English label (or no-language label) is provided, e.g. 'name' for the
   * term 'http://example.com/vocab#name'.
   * @returns {*}
   */
  initializer(iri, rdfFactory, contextStorage, strict) {
    this._litSessionContext = new LitContext("en", contextStorage);

    // Create holders for meta-data on this vocabulary term (we could probably
    // lazily create these only if values are actually provided!).
    this._label = new LitMultiLingualLiteral(
      rdfFactory,
      iri,
      undefined,
      "rdfs:label"
    );

    this._comment = new LitMultiLingualLiteral(
      rdfFactory,
      iri,
      undefined,
      "rdfs:comment"
    );

    this._message = new LitMultiLingualLiteral(
      rdfFactory,
      iri,
      undefined,
      "message (should be defined in RDF vocab using: skos:definition)"
    );

    if (!strict) {
      // This can be overwritten if we get an actual no-language label later,
      // which would be perfectly fine.
      this._label.addValue(
        LitVocabTermBase.extractIriLocalName(iri),
        LitMultiLingualLiteral.NO_LANGUAGE_TAG
      );
    }

    this.resetState();

    // Sets our flag to say we want our value as a string.
    Object.defineProperty(this, "asString", {
      get() {
        this._asRdfLiteral = false;
        return this;
      }
    });

    // Sets our flag to say we want our value as an RDF literal.
    Object.defineProperty(this, "asRdfLiteral", {
      get() {
        this._asRdfLiteral = true;
        return this;
      }
    });

    Object.defineProperty(this, "mandatory", {
      label: "Set our mandatory flag - i.e. throws if not as expected",
      get() {
        this._mandatory = true;
        return this;
      }
    });

    Object.defineProperty(this, "asEnglish", {
      label: "Simple convenience accessor for requesting English",
      get() {
        return this.asLanguage("en");
      }
    });

    Object.defineProperty(this, "label", {
      label: "Accessor for label that uses our LitSessionContext instance",
      get() {
        try {
          const language = this.useLanguageOverrideOrGetFromContext();

          return this._label
            .asLanguage(language)
            .lookup(this._asRdfLiteral, this._mandatory);
        } finally {
          this.resetState();
        }
      }
    });

    Object.defineProperty(this, "comment", {
      label: "Accessor for comment that uses our LitSessionContext instance",
      get() {
        const language = this.useLanguageOverrideOrGetFromContext();

        const result = this._comment
          .asLanguage(language)
          .lookup(this._asRdfLiteral, this._mandatory);

        this.resetState();
        return result;
      }
    });

    Object.defineProperty(this, "message", {
      label: "Accessor for message that uses our LitSessionContext instance",
      get() {
        const language = this.useLanguageOverrideOrGetFromContext();

        const result = this._message
          .asLanguage(language)
          .lookup(this._asRdfLiteral, this._mandatory);

        this.resetState();
        return result;
      }
    });
  }

  resetState() {
    this._asRdfLiteral = true;
    this._languageOverride = undefined;
    this._mandatory = false;
    this._orUndefined = undefined;
  }

  addLabelNoLanguage(value) {
    return this.addLabel(value, LitMultiLingualLiteral.NO_LANGUAGE_TAG);
  }

  addLabel(value, language) {
    this.validateAddParams(value, language, "label");
    this._label.addValue(value, language);
    LitTermRegistry.updateLabel(this.value, language, value);
    return this;
  }

  addCommentNoLanguage(value) {
    return this.addComment(value, LitMultiLingualLiteral.NO_LANGUAGE_TAG);
  }

  addComment(value, language) {
    this.validateAddParams(value, language, "comment");
    this._comment.addValue(value, language);
    LitTermRegistry.updateComment(this.value, language, value);
    return this;
  }

  addMessageNoLanguage(value) {
    return this.addMessage(value, LitMultiLingualLiteral.NO_LANGUAGE_TAG);
  }

  addMessage(value, language) {
    this.validateAddParams(value, language, "message");
    this._message.addValue(value, language);
    LitTermRegistry.updateMessage(this.value, language, value);
    return this;
  }

  /**
   * Ensure we always provide both a value and a lnaguage tag for that value.
   *
   * @param value the test of the value
   * @param language the language tag for the value
   * @param what what kind of value we are adding
   */
  validateAddParams(value, language, what) {
    if (!value) {
      throw new Error(
        `Attempted to add a non-existent [${what}] value to vocab term`
      );
    }

    if (!language) {
      throw new Error(
        `Attempted to add the [${what}] value [${value}], but without specifying a language`
      );
    }

    return this;
  }

  useLanguageOverrideOrGetFromContext() {
    return this._languageOverride === undefined
      ? this._litSessionContext.getLocale()
      : this._languageOverride;
  }

  asLanguage(language) {
    this._languageOverride = language;
    return this;
  }

  messageParams(...rest) {
    const language = this.useLanguageOverrideOrGetFromContext();

    try {
      return this._message
        .asLanguage(language)
        .params(this._asRdfLiteral, this._mandatory, ...rest);
    } finally {
      this.resetState();
    }
  }

  /**
   * Extract the local name from the specified IRI (can be a primitive string or
   * a NamedNode).
   *
   * @param stringOrNamedNode The IRI to extract from.
   * @returns {string}
   */
  static extractIriLocalName(stringOrNamedNode) {
    const iri = this.isString(stringOrNamedNode)
      ? stringOrNamedNode
      : stringOrNamedNode.value;

    const hashPos = iri.lastIndexOf("#");
    if (hashPos === -1) {
      const lastSlashPos = iri.lastIndexOf("/");
      if (
        lastSlashPos === -1 ||
        (iri.toLowerCase().startsWith("http") &&
          lastSlashPos < (iri.toLowerCase().startsWith("https") ? 8 : 7))
      ) {
        throw Error(
          `Expected hash fragment ('#') or slash ('/') (other than 'https://...') in IRI [${iri}]`
        );
      }

      return iri.substring(lastSlashPos + 1);
    }

    return iri.substring(hashPos + 1);
  }

  /**
   * Simple method to determine if the specified value is a primitive String.

   * @param value The value to evaluate.
   * @returns {boolean} true if String, else false.
   */
  static isString(value) {
    return typeof value === "string" || value instanceof String;
  }

  /**
   * Simply treat the value as an IRI if it starts with 'http://' or 'https://'
   * (case-insensitive).
   *
   * @param value
   * @returns {boolean}
   */
  static isStringIri(value) {
    if (!this.isString(value)) {
      return false;
    }

    const valueLower = value.toLowerCase();
    return (
      valueLower.startsWith("http://") || valueLower.startsWith("https://")
    );
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

module.exports = LitVocabTermBase;
