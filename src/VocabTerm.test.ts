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

import { Store, getLocalStore } from "./util/localStorage";

import { DataFactory, NamedNode, Term, Literal } from "rdf-js";
import { DataFactory as DataFactoryImpl } from "rdf-data-factory";
const defaultRdfFactory: DataFactory = new DataFactoryImpl();

import { IriString } from "./index";

import { VocabContext, CONTEXT_KEY_LOCALE } from "./VocabContext";
import { VocabTerm } from "./VocabTerm";

import expect from "expect";

/**
 * Uses a default implementation of an RDF library to construct an RDF term.
 *
 * @param iri the term to build
 * @param context the context within which to build this term
 * @param strict whether to apply local part of name as label
 */
function buildBasicTerm(
  iri: NamedNode | IriString,
  context: Store,
  strict?: boolean
) {
  return new VocabTerm(
    typeof iri === "string" ? defaultRdfFactory.namedNode(iri) : iri,
    defaultRdfFactory,
    context,
    strict
  );
}

/**
 * This Turtle snippet can help to illustrate some of the usage patterns below,
 * with the term 'ex:name' defined as the constant 'TEST_TERM_NAME'.
 *
 *   prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
 *   prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
 *   prefix ex:   <http://example.com/>
 *
 *   ex:name a rdf:Property ;
 *     rdfs:label "Name" ;
 *     rdfs:label "First name"@en ;
 *     rdfs:label "Nombre"@es .
 */
describe("VocabTerm tests", () => {
  const TEST_TERM_NAME_PATH = "localName";
  const rdfFactory: DataFactory = new DataFactoryImpl();
  const TEST_TERM_NAME = rdfFactory.namedNode(
    `test://iri#${TEST_TERM_NAME_PATH}`
  );

  it("should support creating a term using a string IRI", () => {
    const myTerm = new VocabTerm(
      "http://some.vocab#myTerm",
      rdfFactory,
      getLocalStore(),
      false
    ).addLabel("test label...", "en");
    expect(myTerm.iri.value).toBe("http://some.vocab#myTerm");
  });

  it("should return term IRI as a string", () => {
    const termIri = "http://some.vocab#myTerm";
    const myTerm = new VocabTerm(termIri, rdfFactory, getLocalStore(), false);
    expect(myTerm.iriAsString).toBe(termIri);
  });

  it("should return term IRI as a string", () => {
    const termIri = "http://some.vocab#myTerm";
    const myTerm = new VocabTerm(termIri, rdfFactory, getLocalStore(), false);
    expect(myTerm.toString()).toBe(termIri);

    // TODO: Ideally this usage would work in TypeScipt too (it works in
    //  JavaScript), but it results in the following error:
    //  "error TS2538: Type 'VocabTerm' cannot be used as an index type."
    // const obj = { termIri: "test value" };
    // expect(obj[myTerm]).toEqual("test value");
  });

  describe("Strict support", () => {
    it("Should not use IRI local name if no label and strict", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        true
      );
      expect(term.label).toBeUndefined();
    });

    it("Should throw if mandatory and no label and strict", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        true
      );
      expect(() => term.mandatory.label).toThrowError(TEST_TERM_NAME.value);
    });

    it("Should fail to add values if no value or language provided", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        true
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addLabel(null)).toThrowError(
        "Attempted to add a non-existent [label] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addLabel()).toThrowError(
        "Attempted to add a non-existent [label] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addLabel("test value...")).toThrowError(
        "without specifying a language"
      );
      expect(() => term.addLabel("test value...", "")).toThrowError(
        "without specifying a language"
      );

      // @ts-ignore to enable testing error management
      expect(() => term.addComment(null)).toThrowError(
        "Attempted to add a non-existent [comment] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addComment()).toThrowError(
        "Attempted to add a non-existent [comment] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addComment("test value...")).toThrowError(
        "without specifying a language"
      );
      expect(() => term.addComment("test value...", "")).toThrowError(
        "without specifying a language"
      );

      // @ts-ignore to enable testing error management
      expect(() => term.addMessage(null)).toThrowError(
        "Attempted to add a non-existent [message] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addMessage()).toThrowError(
        "Attempted to add a non-existent [message] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addMessage("test value...")).toThrowError(
        "without specifying a language"
      );
      expect(() => term.addMessage("test value...", "")).toThrowError(
        "without specifying a language"
      );
    });

    it("Should allow empty values", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        true
      )
        .addLabelNoLanguage("")
        .addCommentNoLanguage("")
        .addMessageNoLanguage("");

      expect(term.label).toBe("");
      expect(term.labelLiteral).toEqual(rdfFactory.literal("", ""));

      expect(term.comment).toBe("");
      expect(term.message).toBe("");
    });

    it("Should add no-language values", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        false
      )
        .addLabelNoLanguage("test label...")
        .addCommentNoLanguage("test comment...")
        .addMessageNoLanguage("test message...");

      expect(term.label).toBe("test label...");
      expect(term.labelLiteral).toEqual(
        rdfFactory.literal("test label...", "")
      );

      expect(term.comment).toBe("test comment...");
      expect(term.message).toBe("test message...");
    });

    it("Should still fallback to English if language not found", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        true
      )
        .addLabel(`English label...`, "en")
        .addComment(`English comment...`, "en");

      expect(term.asLanguage("fr").labelLiteral).toEqual(
        rdfFactory.literal(`English label...`, "en")
      );
      expect(term.asLanguage("fr").commentLiteral).toEqual(
        rdfFactory.literal(`English comment...`, "en")
      );
    });

    it("should be unecessary to calling mandatory on strict term", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        true
      );
      expect(() => term.mandatory.label).toThrowError("none found");
    });
  });

  describe("Supports labels and comments", () => {
    it("Should use the label context", () => {
      const storage = getLocalStore();
      const label = "Irish label string";
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        storage,
        false
      ).addLabel(label, "ga");

      storage.setItem(CONTEXT_KEY_LOCALE, "ga");
      expect(term.labelLiteral).toEqual(rdfFactory.literal(label, "ga"));
    });

    it("Should use the IRI local name as English label, if needed", () => {
      const unStrictTerm = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        false
      );

      // NOTE: The returned literal has a 'No-Language' tag!
      expect(unStrictTerm.labelLiteral).toEqual(
        rdfFactory.literal(TEST_TERM_NAME_PATH, "")
      );
      expect(unStrictTerm.label).toBe(TEST_TERM_NAME_PATH);

      const englishLabel = "English language value";
      unStrictTerm.addLabel(englishLabel, "en");
      expect(unStrictTerm.labelLiteral).toEqual(
        rdfFactory.literal(englishLabel, "en")
      );
      expect(unStrictTerm.label).toBe(englishLabel);
      expect(unStrictTerm.mandatory.label).toBe(englishLabel);
    });

    it("Should default to English value language", () => {
      const englishLabel = "English label...";
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        false
      ).addLabel(englishLabel, "en");

      expect(term.asLanguage("ga").label).toBe(englishLabel);
    });

    it("Should override language", () => {
      const storage = getLocalStore();
      const irishLabel = "Irish labelLiteral...";
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        storage,
        true
      ).addLabel(irishLabel, "ga");

      expect(term.labelLiteral).toBeUndefined();
      expect(term.asLanguage("fr").labelLiteral).toBeUndefined();

      const englishLabel = "English labelLiteral...";
      term.addLabel(englishLabel, "en");

      expect(term.label).toBe(englishLabel);
      expect(term.asLanguage("").label).toBe(englishLabel);
      expect(term.asLanguage("fr").label).toBe(englishLabel);
      expect(term.asLanguage("ga").label).toBe(irishLabel);

      storage.setItem(CONTEXT_KEY_LOCALE, "ga");
      expect(term.label).toBe(irishLabel);
      expect(term.asLanguage("").label).toBe(englishLabel);
    });

    it("Should throw if mandatory language not found and strict", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        true
      ).addLabel("Test label in English...", "en");

      expect(() => term.mandatory.asLanguage("fr").labelLiteral).toThrowError(
        "none found"
      );

      expect(() => term.mandatory.comment).toThrowError("none found");

      expect(() => term.mandatory.message).toThrowError("none found");
    });

    it("Should return undefined if mandatory language not found and unstrict", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        false
      ).addLabel("Test label in English...", "en");

      expect(() => term.mandatory.asLanguage("fr").labelLiteral).toThrowError(
        TEST_TERM_NAME.value
      );
      expect(() => term.mandatory.comment).toThrowError(TEST_TERM_NAME.value);
      expect(() => term.mandatory.message).toThrowError(TEST_TERM_NAME.value);
    });

    it("Should use the comment context", () => {
      const storage = getLocalStore();
      const comment = "test label string";
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        storage,
        undefined
      ); //.addComment(comment, 'en')

      expect(term.comment).toBeUndefined();
      term.addComment(comment, "en");
      expect(term.comment).toBe(comment);
      storage.setItem(CONTEXT_KEY_LOCALE, "en");
      expect(term.comment).toBe(comment);
      expect(term.asEnglish.comment).toBe(comment);
    });

    it("should support the shorthand asEnglish to get a value in english", () => {
      const storage = getLocalStore();
      const irishLabel = "Irish label...";
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        storage,
        true
      ).addLabel(irishLabel, "ga");
      const englishLabel = "English labelLiteral...";
      term.addLabel(englishLabel, "en");
      expect(term.asEnglish.label).toBe(englishLabel);
    });
  });

  describe("Supports messages (rdfs:literals)", () => {
    it("Should access literal definition with language from context without params", () => {
      const storage = getLocalStore();
      const iri = TEST_TERM_NAME;
      const term = new VocabTerm(iri, rdfFactory, storage, false)
        .addMessage("whatever test", "en")
        .addMessage("test whatever in Spanish", "es");

      expect(term.message).toBe("whatever test");
      storage.setItem(CONTEXT_KEY_LOCALE, "es");
      expect(term.message).toBe("test whatever in Spanish");
    });

    it("Should ignore locale from our context if explicit language, with one param", () => {
      const storage = getLocalStore();
      const term = new VocabTerm(TEST_TERM_NAME, rdfFactory, storage, false)
        .addMessage("Params test {{0}} and {{1}}", "en")
        .addMessage("Prueba de parámetros {{0}} y {{1}}", "es");

      storage.setItem(CONTEXT_KEY_LOCALE, "es");
      expect(term.messageParamsLiteral("first", "second")).toEqual(
        rdfFactory.literal("Prueba de parámetros first y second", "es")
      );

      storage.setItem(CONTEXT_KEY_LOCALE, "en");
      expect(term.messageParams("first", "second")).toBe(
        "Params test first and second"
      );
    });

    it("Should ignore locale from our context if explicit language, with params", () => {
      const storage = getLocalStore();
      const term = new VocabTerm(TEST_TERM_NAME, rdfFactory, storage, false)
        .addMessage("Params test {{0}} and {{1}}", "en")
        .addMessage("Prueba de parámetros {{0}} y {{1}}", "es");

      storage.setItem(CONTEXT_KEY_LOCALE, "es");
      expect(term.asLanguage("en").messageParams("first", "second")).toBe(
        "Params test first and second"
      );

      getLocalStore().setItem(CONTEXT_KEY_LOCALE, "en");
      expect(term.asLanguage("es").messageParams("first", "second")).toBe(
        "Prueba de parámetros first y second"
      );
    });
  });

  describe("extracting IRI local name", () => {
    it("Should throw if no local name", () => {
      expect(() =>
        VocabTerm.extractIriLocalName("http://example.com-whatever")
      ).toThrowError("Expected hash");

      expect(() =>
        VocabTerm.extractIriLocalName("https://example.com-whatever")
      ).toThrowError("Expected hash");
    });

    it("Should extract a / name", () => {
      expect(
        VocabTerm.extractIriLocalName("http://example.com-whatever/localName")
      ).toBe("localName");
    });

    it("Should extract a # name", () => {
      expect(
        VocabTerm.extractIriLocalName("http://example.com-whatever#localName")
      ).toBe("localName");
    });
  });

  describe("String wrapper accessors", () => {
    it("Should return string values", () => {
      const term = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        getLocalStore(),
        false
      )
        .addLabel("test label", "en")
        .addComment("test comment", "en")
        .addMessage("test message", "en");

      expect(term.label).toBe("test label");
      expect(term.comment).toBe("test comment");
      expect(term.message).toBe("test message");
    });
  });

  describe("is string", () => {
    it("Should determine correctly", () => {
      expect(VocabTerm.isString("test user name")).toBe(true);
      expect(VocabTerm.isString(new String("test user name").toString())).toBe(
        true
      );
      // @ts-ignore to enable testing error management
      expect(VocabTerm.isString(57)).toBe(false);
      // @ts-ignore to enable testing error management
      expect(VocabTerm.isString({})).toBe(false);
    });

    it("Should determine IRI correctly", () => {
      expect(VocabTerm.isStringIri("HTTP://xyz")).toBe(true);
      expect(VocabTerm.isStringIri("http://xyz")).toBe(true);
      expect(VocabTerm.isStringIri("HTTPS://xyz")).toBe(true);
      expect(VocabTerm.isStringIri("HTTPs://xyz")).toBe(true);

      expect(VocabTerm.isStringIri("http:/xyz")).toBe(false);
      expect(VocabTerm.isStringIri("HTTPs//xyz")).toBe(false);
      // @ts-ignore to enable testing error management
      expect(VocabTerm.isStringIri(1.99)).toBe(false);
    });
  });

  describe("Implementing RDF/JS", () => {
    it("should be possible to test VocabTerm equality", () => {
      const store = getLocalStore();
      const aTerm = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        store,
        false
      ).addLabel("test label...", "en");
      const anotherTerm = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        store,
        false
      ).addLabel("test label...", "en");
      const aDifferentTerm = new VocabTerm(
        rdfFactory.namedNode(`${TEST_TERM_NAME.value}_`),
        rdfFactory,
        store,
        false
      ).addLabel("test label...", "en");

      expect(aTerm.equals(anotherTerm)).toBe(true);
      expect(aTerm.equals(aDifferentTerm)).toBe(false);
    });
  });

  describe("Embedding an RDFJS implementation", () => {
    it("should be possible to get a valid VocabTerm without providing any DataFactory", () => {
      const store = getLocalStore();
      const aTerm = buildBasicTerm(TEST_TERM_NAME, store, false).addLabel(
        "test label...",
        "en"
      );
      const anotherTerm = new VocabTerm(
        TEST_TERM_NAME,
        rdfFactory,
        store,
        false
      ).addLabel("test label...", "en");
      expect(aTerm.equals(anotherTerm)).toBe(true);
    });

    it("should support building terms from a string", () => {
      const myTerm = buildBasicTerm(
        "http://some.vocab#myTerm",
        getLocalStore(),
        false
      ).addLabel("test label...", "en");
      expect(myTerm.iri.value).toBe("http://some.vocab#myTerm");
    });
  });

  describe("SeeAlso support", () => {
    it("should add and retrieve 'seeAlso' IRIs", () => {
      const myTerm = buildBasicTerm(
        "http://some.vocab#myTerm",
        getLocalStore(),
        false
      );
      expect(myTerm.seeAlso).toBeUndefined();

      myTerm.addSeeAlso(TEST_TERM_NAME);
      expect(myTerm.seeAlso!.size).toBe(1);
      expect(myTerm.seeAlso!.has(TEST_TERM_NAME)).toBe(true);
    });

    it("should treat as a set", () => {
      const myTerm = buildBasicTerm(
        "http://some.vocab#myTerm",
        getLocalStore(),
        false
      )
        .addSeeAlso(TEST_TERM_NAME)
        .addSeeAlso(TEST_TERM_NAME);

      expect(myTerm.seeAlso!.size).toBe(1);
    });
  });

  describe("isDefinedBy support", () => {
    it("should add and retrieve 'isDefinedBy' IRI", () => {
      const myTerm = buildBasicTerm(
        "http://some.vocab#myTerm",
        getLocalStore(),
        false
      );

      expect(myTerm.isDefinedBy).toBeUndefined();
      myTerm.addIsDefinedBy(TEST_TERM_NAME);
      expect(myTerm.isDefinedBy!).toBe(TEST_TERM_NAME);
    });
  });
});
