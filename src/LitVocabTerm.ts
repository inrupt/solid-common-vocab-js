/**
 * Proprietary and Confidential
 *
 * Copyright 2020 Inrupt Inc. - all rights reserved.
 *
 * Do not use without explicit permission from Inrupt Inc.
 */

import { Store } from "./utils/localStorage";
import { LitContext } from "./LitContext";
import { LitTermRegistry } from "./LitTermRegistry";
import {
  LitMultiLingualLiteral,
  NO_LANGUAGE_TAG,
} from "./LitMultiLingualLiteral";
import { DataFactory, NamedNode, Term, Literal } from "rdf-js";
import { IriString } from "./index";
import rdf from "@rdfjs/data-model";

const DEFAULT_LOCALE = "en";

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
class LitVocabTerm implements NamedNode {
  iri: NamedNode;
  rdfFactory: DataFactory;
  strict: boolean;

  // Literals describing the term
  private _label: LitMultiLingualLiteral;
  private _comment: LitMultiLingualLiteral;
  private _message: LitMultiLingualLiteral;

  // Context store
  private _litSessionContext: LitContext;
  private _registry: LitTermRegistry;

  // Internal state
  private _mandatory: boolean;
  private _languageOverride: string | undefined;

  // Implementation of the NamedNode interface
  termType: "NamedNode" = "NamedNode";
  get value(): string {
    return this.iri.value;
  }
  equals(other: Term): boolean {
    return this.iri.equals(other);
  }

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
  constructor(
    iri: NamedNode | IriString,
    rdfFactory: DataFactory,
    contextStorage: Store,
    strict?: boolean
  ) {
    if (typeof iri === "string") {
      this.iri = rdfFactory.namedNode(iri);
    } else {
      this.iri = iri;
    }
    this.rdfFactory = rdfFactory;
    if (strict !== undefined) {
      this.strict = strict;
    } else {
      this.strict = false;
    }

    this._litSessionContext = new LitContext(DEFAULT_LOCALE, contextStorage);
    this._registry = new LitTermRegistry(contextStorage);

    // Create holders for meta-data on this vocabulary term (we could probably
    // lazily create these only if values are actually provided!).
    this._label = new LitMultiLingualLiteral(
      rdfFactory,
      this.iri,
      undefined,
      "rdfs:label"
    );

    this._comment = new LitMultiLingualLiteral(
      rdfFactory,
      this.iri,
      undefined,
      "rdfs:comment"
    );

    this._message = new LitMultiLingualLiteral(
      rdfFactory,
      this.iri,
      undefined,
      "message (should be defined in RDF vocab using: skos:definition)"
    );

    if (!strict) {
      // This can be overwritten if we get an actual no-language label later,
      // which would be perfectly fine.
      this._label.addValue(
        LitVocabTerm.extractIriLocalName(iri),
        NO_LANGUAGE_TAG
      );
    }

    // Stateful variables defaults
    this._mandatory = true;
    this._languageOverride = undefined;

    this.resetState();
  }

  // Set our mandatory flag - i.e. throws if not as expected
  get mandatory(): LitVocabTerm {
    this._mandatory = true;
    return this;
  }

  // Simple convenience accessor for requesting English
  get asEnglish(): LitVocabTerm {
    return this.asLanguage("en");
  }

  // Accessor for label that uses our LitSessionContext instance
  get label(): Literal | undefined {
    try {
      const language = this.useLanguageOverrideOrGetFromContext();
      return this._label.asLanguage(language).lookup(this._mandatory);
    } finally {
      this.resetState();
    }
  }

  // Accessor for comment that uses our LitSessionContext instance
  get comment() {
    try {
      const language = this.useLanguageOverrideOrGetFromContext();
      return this._comment.asLanguage(language).lookup(this._mandatory);
    } finally {
      this.resetState();
    }
  }

  // Accessor for message that uses our LitSessionContext instance
  get message() {
    try {
      const language = this.useLanguageOverrideOrGetFromContext();
      return this._message.asLanguage(language).lookup(this._mandatory);
    } finally {
      this.resetState();
    }
  }

  resetState() {
    this._languageOverride = undefined;
    this._mandatory = false;
  }

  addLabelNoLanguage(value: string) {
    return this.addLabel(value, NO_LANGUAGE_TAG);
  }

  addLabel(value: string, language: string) {
    this.validateAddParams(value, language, "label");
    this._label.addValue(value, language);
    this._registry.updateLabel(this.value, language, value);
    return this;
  }

  addCommentNoLanguage(value: string) {
    return this.addComment(value, NO_LANGUAGE_TAG);
  }

  addComment(value: string, language: string) {
    this.validateAddParams(value, language, "comment");
    this._comment.addValue(value, language);
    this._registry.updateComment(this.value, language, value);
    return this;
  }

  addMessageNoLanguage(value: string) {
    return this.addMessage(value, NO_LANGUAGE_TAG);
  }

  addMessage(value: string, language: string) {
    this.validateAddParams(value, language, "message");
    this._message.addValue(value, language);
    this._registry.updateMessage(this.value, language, value);
    return this;
  }

  /**
   * Ensure we always provide both a value and a lnaguage tag for that value.
   *
   * @param value the test of the value
   * @param language the language tag for the value
   * @param what what kind of value we are adding
   */
  validateAddParams(value: string, language: string, what: string) {
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

  asLanguage(language: string) {
    // An empty string is converted to the NO_LANGUAGE_TAG
    this._languageOverride = language || NO_LANGUAGE_TAG;
    return this;
  }

  messageParams(...rest: string[]) {
    const language = this.useLanguageOverrideOrGetFromContext();

    try {
      return this._message
        .asLanguage(language)
        .params(this._mandatory, ...rest);
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
  static extractIriLocalName(stringOrNamedNode: string | NamedNode) {
    const iri = this.isString(stringOrNamedNode)
      ? stringOrNamedNode
      : stringOrNamedNode.value;

    const hashPos = iri.lastIndexOf("#");
    if (hashPos > -1) {
      return iri.substring(hashPos + 1);
    }

    const lastSlashPos = iri.lastIndexOf("/");
    if (
      lastSlashPos === -1 ||
      (iri.toLowerCase().startsWith("http") &&
        lastSlashPos < (iri.toLowerCase().startsWith("https") ? 8 : 7))
    ) {
      throw Error(
        `Expected hash fragment ('#') or slash ('/') (other than 'https://...') in IRI [${iri}]`
      );
    } else {
      return iri.substring(lastSlashPos + 1);
    }
  }

  /**
   * Simple method to determine if the specified value is a primitive String.

   * @param value The value to evaluate.
   * @returns {boolean} true if String, else false.
   */
  static isString(value: string | NamedNode): value is string {
    return typeof value === "string" || value instanceof String;
  }

  /**
   * Simply treat the value as an IRI if it starts with 'http://' or 'https://'
   * (case-insensitive).
   *
   * @param value
   * @returns {boolean}
   */
  static isStringIri(value: string) {
    if (!this.isString(value)) {
      return false;
    }

    const valueLower = value.toLowerCase();
    return (
      valueLower.startsWith("http://") || valueLower.startsWith("https://")
    );
  }
}

/**
 * This constructor exposes a base LitVocabTerm implementation by providing
 * a simple RDFJS Datafactory.
 * @param iri
 * @param context
 * @param strict
 */
function buildBasicTerm(
  iri: NamedNode | IriString,
  context: Store,
  strict?: boolean
) {
  if (typeof iri === "string") {
    return new LitVocabTerm(rdf.namedNode(iri), rdf, context, strict);
  }
  return new LitVocabTerm(iri, rdf, context, strict);
}

export { LitVocabTerm, buildBasicTerm };
