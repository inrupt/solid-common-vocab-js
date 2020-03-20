"use strict";

const debug = require("debug")("lit-vocab-term:LitMultiLingualLiteral");

const NO_LANGUAGE_TAG = "<No Language>";

/**
 * Class that defines the concept of a multi-lingual literal (as in a String
 * literal). We can add multiple values in different languages, and look them
 * up again.
 * Also supports parameterized string values (using {{0}} placeholders), for
 * which we can provide values when looking them up.
 */
class LitMultiLingualLiteral {
  static get NO_LANGUAGE_TAG() {
    return NO_LANGUAGE_TAG;
  }

  /**
   *
   * @param rdfFactory Expected to provide RDF primitives (e.g. named nodes,
   * literals, etc.).
   * @param iri The IRI for this instance
   * @param values The values (if any) to initialise this instance
   * @param contextMessage Context information (helpful for debugging)
   * @returns {LitMultiLingualLiteral|*}
   */
  constructor(rdfFactory, iri, values, contextMessage) {
    this._rdfFactory = rdfFactory;
    this._iri = iri;
    this._values = values ? values : new Map();
    this._contextMessage = contextMessage ? contextMessage : "<None provided>";

    // Default to English.
    this._language = "en";

    this._expandedMessage = undefined;

    // Sets the language to 'English', but returns our current instance.
    Object.defineProperty(this, "setToEnglish", {
      get() {
        this.asLanguage("en");
        return this;
      }
    });
  }

  getIri() {
    return this._iri;
  }

  asLanguage(tag) {
    this._language = tag;
    return this;
  }

  addValue(value, locale) {
    this._values.set(locale, value);
    return this;
  }

  lookupEnglish(asRdfLiteral, mandatory) {
    return this.asLanguage("en").lookup(asRdfLiteral, mandatory);
  }

  /**
   * Looks up a message in the currently set language, but if none found we
   * use the English message (which code-generators can enforce, so they should
   * always ensure at least an English message for vocab terms).
   *
   * NOTE: If we do use the English default, then we also reset our language
   * tag so that if we are returning an RDF literal it will contain the correct
   * language tag (i.e. 'en'), and not the requested language that didn't exist!
   *
   * @param language The requested language (but if not found we use English
   * and reset our language tag to 'en').
   * @returns {*}
   */
  lookup(asRdfLiteral, mandatory) {
    const message = this.lookupButDefaultToEnglishOrNoLanguage(mandatory);
    return this.returnAsStringOrRdfLiteral(asRdfLiteral, message);
  }

  /**
   * Private method that only looks up the string itself (i.e. will not attempt
   * to wrap in an RDF literal).
   *
   * @param language
   * @returns {*}
   */
  lookupButDefaultToEnglishOrNoLanguage(mandatory) {
    let message = this._values.get(this._language);
    if (!message) {
      if (mandatory) {
        // NOTE: we explicitly throw here, regardless of our 'throw' parameter.
        return this.handleError(
          true,
          `MultiLingualLiteral message with IRI [${this._iri}] required value in language [${this._language}], but none found (Context: [${this._contextMessage}]).`
        );
      }

      message = this._values.get("en");
      if (message) {
        this._language = "en";
      } else {
        message = this._values.get(NO_LANGUAGE_TAG);
        if (!message) {
          return this.handleError(
            mandatory,
            `MultiLingualLiteral lookup on term [${this._iri}] for language [${this._language}], but no values at all (even English, or no language tag at all) (Context: [${this._contextMessage}]).`
          );
        }

        this._language = NO_LANGUAGE_TAG;
      }
    }

    return message;
  }

  /**
   * TODO: Won't yet handle replacing multiple uses of say {{1}} in a single
   *  string, which I guess it should...!?
   *
   * @returns {*}
   */
  params(asRdfLiteral, mandatory, ...rest) {
    let message = this.lookupButDefaultToEnglishOrNoLanguage(mandatory);

    // If we failed to find a value at all (and didn't throw!), then return
    // 'undefined'.
    if (message === undefined) {
      return undefined;
    }

    const paramsRequired = message.split("{{").length - 1;
    if (paramsRequired !== rest.length) {
      return this.handleError(
        mandatory,
        `Setting parameters on LitMultiLingualLiteral with IRI [${this._iri}] and value [${message}] in language [${this._language}], but it requires [${paramsRequired}] params and we received [${rest.length}] (Context: [${this._contextMessage}]).`
      );
    }

    for (let i = 0; i < rest.length; i++) {
      const marker = `{{${i}}}`;
      message = message.replace(marker, rest[i]);
    }

    return this.returnAsStringOrRdfLiteral(asRdfLiteral, message);
  }

  returnAsStringOrRdfLiteral(asRdfLiteral, message) {
    if (message === undefined) {
      return undefined;
    }

    const result = asRdfLiteral
      ? this._rdfFactory.literal(message, this.handleNoLanguageTag())
      : message;

    this._expandedMessage = message;
    return result;
  }

  /**
   * We use a marker for no-language literals, so this handles that marker
   * and returns the correct RDF tag for 'no-language'.
   *
   * @returns {string}
   */
  handleNoLanguageTag() {
    return this._language === NO_LANGUAGE_TAG ? "" : this._language;
  }

  /**
   * Handle errors - we'll throw an error (with the specified message) unless
   * we're told not to throw an exception, in which case we return 'undefined'
   * instead.
   *
   * @param mandatory Flag if true we return undefined, else we throw an error
   * @param message the message to throw (we also write to 'debug')
   * @returns {undefined} an Error or undefined if no exceptions...
   */
  handleError(mandatory, message) {
    debug(message);

    if (mandatory) {
      throw new Error(message);
    }

    return undefined;
  }
}

module.exports = LitMultiLingualLiteral;
