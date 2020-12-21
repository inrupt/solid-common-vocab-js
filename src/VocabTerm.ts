/**
 * Begin license text.
 * Copyright 2020 Inrupt Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * End license text.Source Distributions
 */

import { Store } from "./util/localStorage";
import { VocabContext } from "./VocabContext";
import { VocabTermRegistry } from "./VocabTermRegistry";
import {
  VocabMultiLingualLiteral,
  NO_LANGUAGE_TAG,
} from "./VocabMultiLingualLiteral";
import { DataFactory, NamedNode, Term, Literal } from "rdf-js";
import { IriString } from "./index";

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
class VocabTerm implements NamedNode {
  iri: NamedNode;
  rdfFactory: DataFactory;
  strict: boolean;

  // Literals describing the term.
  private _label: VocabMultiLingualLiteral;
  private _comment: VocabMultiLingualLiteral;
  private _message: VocabMultiLingualLiteral;

  // Context store.
  private _litSessionContext: VocabContext;
  private _registry: VocabTermRegistry;

  // Internal state.
  private _mandatory: boolean;
  private _languageOverride: string | undefined;
  private _isDefinedBy: NamedNode | undefined; // Only allow one value.
  private _seeAlso: Set<NamedNode> | undefined;

  // Implementation of the NamedNode interface.
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

    this._litSessionContext = new VocabContext(DEFAULT_LOCALE, contextStorage);
    this._registry = new VocabTermRegistry(contextStorage);

    // Create holders for meta-data on this vocabulary term (we could probably
    // lazily create these only if values are actually provided!).
    this._label = new VocabMultiLingualLiteral(
      rdfFactory,
      this.iri,
      undefined,
      "rdfs:label"
    );

    this._comment = new VocabMultiLingualLiteral(
      rdfFactory,
      this.iri,
      undefined,
      "rdfs:comment"
    );

    this._message = new VocabMultiLingualLiteral(
      rdfFactory,
      this.iri,
      undefined,
      "message (should be defined in RDF vocab using: skos:definition)"
    );

    if (!strict) {
      // This can be overwritten if we get an actual no-language label later,
      // which would be perfectly fine.
      this._label.addValue(VocabTerm.extractIriLocalName(iri), NO_LANGUAGE_TAG);
    }

    // Stateful variables defaults.
    this._mandatory = true;
    this._languageOverride = undefined;
    this._isDefinedBy = undefined;
    this._seeAlso = undefined;

    this.resetState();
  }

  // Set our mandatory flag - i.e. throws if not as expected.
  get mandatory(): VocabTerm {
    this._mandatory = true;
    return this;
  }

  get seeAlso(): Set<NamedNode> | undefined {
    return this._seeAlso;
  }

  get isDefinedBy(): NamedNode | undefined {
    return this._isDefinedBy;
  }

  // Simple convenience accessor for requesting English.
  get asEnglish(): VocabTerm {
    return this.asLanguage("en");
  }

  // Explicitly named alias for getting the IRI of this term as a String.
  get iriAsString(): string {
    return this.value;
  }

  // Accessor for label that uses our LitSessionContext instance.
  get labelLiteral(): Literal | undefined {
    try {
      const language = this.useLanguageOverrideOrGetFromContext();
      return this._label.asLanguage(language).lookup(this._mandatory);
    } finally {
      this.resetState();
    }
  }

  get label(): string | undefined {
    const label = this.labelLiteral;
    return label && label.value;
  }

  // Accessor for comment that uses our LitSessionContext instance.
  get commentLiteral(): Literal | undefined {
    try {
      const language = this.useLanguageOverrideOrGetFromContext();
      return this._comment.asLanguage(language).lookup(this._mandatory);
    } finally {
      this.resetState();
    }
  }

  get comment(): string | undefined {
    const comment = this.commentLiteral;
    return comment && comment.value;
  }

  // Accessor for message that uses our LitSessionContext instance.
  get messageLiteral(): Literal | undefined {
    try {
      const language = this.useLanguageOverrideOrGetFromContext();
      return this._message.asLanguage(language).lookup(this._mandatory);
    } finally {
      this.resetState();
    }
  }

  get message(): string | undefined {
    const message = this.messageLiteral;
    return message && message.value;
  }

  // Get the IRI of this term as a String (means we can treat this object
  // instance as a string more easily).
  // NOTE: This is *NOT* an accessor, but deliberately overriding the
  // 'toString()' method on the base Object.
  toString(): string {
    return this.value;
  }

  messageParamsLiteral(...rest: string[]): Literal | undefined {
    const language = this.useLanguageOverrideOrGetFromContext();

    try {
      return this._message
        .asLanguage(language)
        .params(this._mandatory, ...rest);
    } finally {
      this.resetState();
    }
  }

  messageParams(...rest: string[]): string | undefined {
    const messageParams = this.messageParamsLiteral(...rest);
    return messageParams && messageParams.value;
  }

  resetState() {
    this._languageOverride = undefined;
    this._mandatory = false;
  }

  addSeeAlso(value: NamedNode) {
    if (!this._seeAlso) {
      this._seeAlso = new Set<NamedNode>();
    }

    this._seeAlso.add(value);
    return this;
  }

  addIsDefinedBy(value: NamedNode) {
    this._isDefinedBy = value;
    return this;
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
    if (value === undefined || value === null) {
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
    // An empty string is converted to the NO_LANGUAGE_TAG.
    this._languageOverride = language || NO_LANGUAGE_TAG;
    return this;
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

export { VocabTerm };
