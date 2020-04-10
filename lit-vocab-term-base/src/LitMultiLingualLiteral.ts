import { DataFactory, Literal, NamedNode, Term } from "rdf-js";

const NO_LANGUAGE_TAG = "<No Language>";

// Typically, this would come from a LIT-generated artifact,
// but since those are based on the current project, it's
// easier to define the constants manually
const XSD_STRING = "http://www.w3.org/2001/XMLSchema#string";
const RDF_LANGSTRING = "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString";

function isLiteral(term: Term): term is Literal {
  return (term as Literal).language !== undefined;
}

/**
 * Class that defines the concept of a multi-lingual literal (as in a String
 * literal). We can add multiple values in different languages, and look them
 * up again.
 * Also supports parameterized string values (using {{0}} placeholders), for
 * which we can provide values when looking them up.
 */
class LitMultiLingualLiteral implements Literal {
  _rdfFactory: DataFactory;
  _iri: NamedNode;
  _values: Map<string, string>;
  _contextMessage: string;
  _language?: string;
  _expandedMessage?: string;

  get setToEnglish(): LitMultiLingualLiteral {
    this.asLanguage("en");
    return this;
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
  constructor(
    rdfFactory: DataFactory,
    iri: NamedNode,
    values?: Map<String, String>,
    contextMessage?: string
  ) {
    this._rdfFactory = rdfFactory;
    this._iri = iri;
    this._values = values ? values : new Map();
    this._contextMessage = contextMessage ? contextMessage : "<None provided>";

    this._language = undefined;

    this._expandedMessage = undefined;
  }

  // Implementing the RDFJS Literal interface
  termType: "Literal" = "Literal";

  get value(): string {
    return this.lookup(false)?.value || "";
  }

  get language(): string {
    if (!this._language || this._language === NO_LANGUAGE_TAG) {
      return "";
    } else {
      return this._language;
    }
  }

  equals(other: Term): boolean {
    if (isLiteral(other)) {
      return (
        this._values.get(other.language || NO_LANGUAGE_TAG) === other.value
      );
    } else {
      return false;
    }
  }

  get datatype(): NamedNode {
    if (!this.language || this.language == NO_LANGUAGE_TAG) {
      return this._rdfFactory.namedNode(XSD_STRING);
    } else {
      return this._rdfFactory.namedNode(RDF_LANGSTRING);
    }
  }

  getIri() {
    return this._iri;
  }

  asLanguage(tag: string) {
    this._language = tag;
    return this;
  }

  addValue(value: string, locale: string) {
    if (!this._language) {
      this._language = locale;
    }
    this._values.set(locale, value);
    return this;
  }

  lookupEnglish(mandatory: boolean) {
    return this.asLanguage("en").lookup(mandatory);
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
  lookup(mandatory: boolean) {
    const message = this.lookupButDefaultToEnglishOrNoLanguage(mandatory);
    if (message === undefined) {
      return undefined;
    }

    this._expandedMessage = message;
    return this._rdfFactory.literal(message, this.handleNoLanguageTag());
  }

  /**
   * Private method that only looks up the string itself (i.e. will not attempt
   * to wrap in an RDF literal).
   *
   * @param language
   * @returns {*}
   */
  lookupButDefaultToEnglishOrNoLanguage(
    mandatory: boolean
  ): string | undefined {
    if (!this._language) {
      if (mandatory) {
        throw new Error("No value has been added to the literal");
      } else {
        return undefined;
      }
    }
    let message = this._values.get(this._language);
    if (message) {
      return message;
    } else if (mandatory) {
      // NOTE: we explicitly throw here, regardless of our 'throw' parameter.
      throw new Error(
        `MultiLingualLiteral message with IRI [${this._iri.value}] required value in language [${this._language}], but none found (Context: [${this._contextMessage}]).`
      );
    } else {
      message = this._values.get("en");
      if (message) {
        this._language = "en";
      } else {
        message = this._values.get(NO_LANGUAGE_TAG);
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
  params(mandatory: boolean, ...rest: string[]): Literal | undefined {
    let message = this.lookupButDefaultToEnglishOrNoLanguage(mandatory);

    // If we failed to find a value at all (and didn't throw!), then return
    // 'undefined'.
    if (message === undefined) {
      return undefined;
    }

    const paramsRequired = message.split("{{").length - 1;
    if (paramsRequired !== rest.length) {
      throw new Error(
        `Setting parameters on LitMultiLingualLiteral with IRI [${this._iri.value}] and value [${message}] in language [${this._language}], but it requires [${paramsRequired}] params and we received [${rest.length}] (Context: [${this._contextMessage}]).`
      );
    }

    for (let i = 0; i < rest.length; i++) {
      const marker = `{{${i}}}`;
      message = message.replace(marker, rest[i]);
    }

    this._expandedMessage = message;
    return this._rdfFactory.literal(message, this.handleNoLanguageTag());
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
}

export { LitMultiLingualLiteral, NO_LANGUAGE_TAG, XSD_STRING, RDF_LANGSTRING };
