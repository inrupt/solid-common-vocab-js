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

import { getLocalStore } from "./utils/localStorage";
import DataFactory from "@rdfjs/data-model";

import { LitContext, CONTEXT_KEY_LOCALE } from "./LitContext";
import { LitVocabTerm, buildBasicTerm } from "./LitVocabTerm";

import chai from "chai";
const expect = chai.expect;

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
describe("LitVocabTerm tests", () => {
  const TEST_TERM_NAME_PATH = "localName";
  const TEST_TERM_NAME = DataFactory.namedNode(
    `test://iri#${TEST_TERM_NAME_PATH}`
  );

  it("should support creating a term using a string IRI", () => {
    const myTerm = new LitVocabTerm(
      "http://some.vocab#myTerm",
      DataFactory,
      getLocalStore(),
      false
    ).addLabel("test label...", "en");
    expect(myTerm.iri.value).to.equal("http://some.vocab#myTerm");
  });

  it("should return term IRI as a string", () => {
    const termIri = "http://some.vocab#myTerm";
    const myTerm = new LitVocabTerm(
      termIri,
      DataFactory,
      getLocalStore(),
      false
    );
    expect(myTerm.iriAsString).to.equal(termIri);
  });

  it("should return term IRI as a string", () => {
    const termIri = "http://some.vocab#myTerm";
    const myTerm = new LitVocabTerm(
      termIri,
      DataFactory,
      getLocalStore(),
      false
    );
    expect(myTerm.toString()).to.equal(termIri);

    // TODO: Ideally this usage would work in TypeScipt too (it works in
    //  JavaScript), but it results in the following error:
    //  "error TS2538: Type 'LitVocabTerm' cannot be used as an index type."
    // const obj = { termIri: "test value" };
    // expect(obj[myTerm]).to.equal("test value");
  });

  describe("Strict support", () => {
    it("Should not use IRI local name if no label and strict", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        true
      );
      expect(term.label).to.be.undefined;
    });

    it("Should throw if mandatory and no label and strict", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        true
      );
      expect(() => term.mandatory.label).to.throw(TEST_TERM_NAME.value);
    });

    it("Should fail to add values if no value or language provided", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        true
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addLabel(null)).to.throw(
        "Attempted to add a non-existent [label] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addLabel()).to.throw(
        "Attempted to add a non-existent [label] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addLabel("test value...")).to.throw(
        "without specifying a language"
      );
      expect(() => term.addLabel("test value...", "")).to.throw(
        "without specifying a language"
      );

      // @ts-ignore to enable testing error management
      expect(() => term.addComment(null)).to.throw(
        "Attempted to add a non-existent [comment] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addComment()).to.throw(
        "Attempted to add a non-existent [comment] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addComment("test value...")).to.throw(
        "without specifying a language"
      );
      expect(() => term.addComment("test value...", "")).to.throw(
        "without specifying a language"
      );

      // @ts-ignore to enable testing error management
      expect(() => term.addMessage(null)).to.throw(
        "Attempted to add a non-existent [message] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addMessage()).to.throw(
        "Attempted to add a non-existent [message] value to vocab term"
      );
      // @ts-ignore to enable testing error management
      expect(() => term.addMessage("test value...")).to.throw(
        "without specifying a language"
      );
      expect(() => term.addMessage("test value...", "")).to.throw(
        "without specifying a language"
      );
    });

    it("Should allow empty values", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        true
      )
        .addLabelNoLanguage("")
        .addCommentNoLanguage("")
        .addMessageNoLanguage("");

      expect(term.label).to.equal("");
      expect(term.labelLiteral).deep.equal(DataFactory.literal("", ""));

      expect(term.comment).to.equal("");
      expect(term.message).to.equal("");
    });

    it("Should add no-language values", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        false
      )
        .addLabelNoLanguage("test label...")
        .addCommentNoLanguage("test comment...")
        .addMessageNoLanguage("test message...");

      expect(term.label).to.equal("test label...");
      expect(term.labelLiteral).deep.equal(
        DataFactory.literal("test label...", "")
      );

      expect(term.comment).to.equal("test comment...");
      expect(term.message).to.equal("test message...");
    });

    it("Should still fallback to English if language not found", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        true
      )
        .addLabel(`English label...`, "en")
        .addComment(`English comment...`, "en");

      expect(term.asLanguage("fr").labelLiteral).deep.equal(
        DataFactory.literal(`English label...`, "en")
      );
      expect(term.asLanguage("fr").commentLiteral).deep.equal(
        DataFactory.literal(`English comment...`, "en")
      );
    });

    it("should be unecessary to calling mandatory on strict term", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        true
      );
      expect(() => term.mandatory.label).to.throw("none found");
    });
  });

  describe("Supports labels and comments", () => {
    it("Should use the label context", () => {
      const storage = getLocalStore();
      const label = "Irish label string";
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        storage,
        false
      ).addLabel(label, "ga");

      storage.setItem(CONTEXT_KEY_LOCALE, "ga");
      expect(term.labelLiteral).deep.equals(DataFactory.literal(label, "ga"));
    });

    it("Should use the IRI local name as English label, if needed", () => {
      const unStrictTerm = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        false
      );

      // NOTE: The returned literal has a 'No-Language' tag!
      expect(unStrictTerm.labelLiteral).deep.equals(
        DataFactory.literal(TEST_TERM_NAME_PATH, "")
      );
      expect(unStrictTerm.label).equals(TEST_TERM_NAME_PATH);

      const englishLabel = "English language value";
      unStrictTerm.addLabel(englishLabel, "en");
      expect(unStrictTerm.labelLiteral).deep.equals(
        DataFactory.literal(englishLabel, "en")
      );
      expect(unStrictTerm.label).equals(englishLabel);
      expect(unStrictTerm.mandatory.label).equals(englishLabel);
    });

    it("Should default to English value language", () => {
      const englishLabel = "English label...";
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        false
      ).addLabel(englishLabel, "en");

      expect(term.asLanguage("ga").label).equals(englishLabel);
    });

    it("Should override language", () => {
      const storage = getLocalStore();
      const irishLabel = "Irish labelLiteral...";
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        storage,
        true
      ).addLabel(irishLabel, "ga");

      expect(term.labelLiteral).to.be.undefined;
      expect(term.asLanguage("fr").labelLiteral).to.be.undefined;

      const englishLabel = "English labelLiteral...";
      term.addLabel(englishLabel, "en");

      expect(term.label).equals(englishLabel);
      expect(term.asLanguage("").label).equals(englishLabel);
      expect(term.asLanguage("fr").label).equals(englishLabel);
      expect(term.asLanguage("ga").label).equals(irishLabel);

      storage.setItem(CONTEXT_KEY_LOCALE, "ga");
      expect(term.label).equals(irishLabel);
      expect(term.asLanguage("").label).equals(englishLabel);
    });

    it("Should throw if mandatory language not found and strict", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        true
      ).addLabel("Test label in English...", "en");

      expect(() => term.mandatory.asLanguage("fr").labelLiteral).to.throw(
        "none found"
      );

      expect(() => term.mandatory.comment).to.throw("none found");

      expect(() => term.mandatory.message).to.throw("none found");
    });

    it("Should return undefined if mandatory language not found and unstrict", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        false
      ).addLabel("Test label in English...", "en");

      expect(() => term.mandatory.asLanguage("fr").labelLiteral).to.throw(
        TEST_TERM_NAME.value
      );
      expect(() => term.mandatory.comment).to.throw(TEST_TERM_NAME.value);
      expect(() => term.mandatory.message).to.throw(TEST_TERM_NAME.value);
    });

    it("Should use the comment context", () => {
      const storage = getLocalStore();
      const comment = "test label string";
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        storage,
        undefined
      ); //.addComment(comment, 'en')

      expect(term.comment).to.be.undefined;
      term.addComment(comment, "en");
      expect(term.comment).equals(comment);
      storage.setItem(CONTEXT_KEY_LOCALE, "en");
      expect(term.comment).equals(comment);
      expect(term.asEnglish.comment).equals(comment);
    });

    it("should support the shorthand asEnglish to get a value in english", () => {
      const storage = getLocalStore();
      const irishLabel = "Irish label...";
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        storage,
        true
      ).addLabel(irishLabel, "ga");
      const englishLabel = "English labelLiteral...";
      term.addLabel(englishLabel, "en");
      expect(term.asEnglish.label).to.equal(englishLabel);
    });
  });

  describe("Supports messages (rdfs:literals)", () => {
    it("Should access literal definition with language from context without params", () => {
      const storage = getLocalStore();
      const iri = TEST_TERM_NAME;
      const term = new LitVocabTerm(iri, DataFactory, storage, false)
        .addMessage("whatever test", "en")
        .addMessage("test whatever in Spanish", "es");

      expect(term.message).equals("whatever test");
      storage.setItem(CONTEXT_KEY_LOCALE, "es");
      expect(term.message).equals("test whatever in Spanish");
    });

    it("Should ignore locale from our context if explicit language, with one param", () => {
      const storage = getLocalStore();
      const term = new LitVocabTerm(TEST_TERM_NAME, DataFactory, storage, false)
        .addMessage("Params test {{0}} and {{1}}", "en")
        .addMessage("Prueba de parámetros {{0}} y {{1}}", "es");

      storage.setItem(CONTEXT_KEY_LOCALE, "es");
      expect(term.messageParamsLiteral("first", "second")).deep.equals(
        DataFactory.literal("Prueba de parámetros first y second", "es")
      );

      storage.setItem(CONTEXT_KEY_LOCALE, "en");
      expect(term.messageParams("first", "second")).equals(
        "Params test first and second"
      );
    });

    it("Should ignore locale from our context if explicit language, with params", () => {
      const storage = getLocalStore();
      const term = new LitVocabTerm(TEST_TERM_NAME, DataFactory, storage, false)
        .addMessage("Params test {{0}} and {{1}}", "en")
        .addMessage("Prueba de parámetros {{0}} y {{1}}", "es");

      storage.setItem(CONTEXT_KEY_LOCALE, "es");
      expect(term.asLanguage("en").messageParams("first", "second")).equals(
        "Params test first and second"
      );

      getLocalStore().setItem(CONTEXT_KEY_LOCALE, "en");
      expect(term.asLanguage("es").messageParams("first", "second")).equals(
        "Prueba de parámetros first y second"
      );
    });
  });

  describe("extracting IRI local name", () => {
    it("Should throw if no local name", () => {
      expect(() =>
        LitVocabTerm.extractIriLocalName("http://example.com-whatever")
      ).to.throw("Expected hash");

      expect(() =>
        LitVocabTerm.extractIriLocalName("https://example.com-whatever")
      ).to.throw("Expected hash");
    });

    it("Should extract a / name", () => {
      expect(
        LitVocabTerm.extractIriLocalName(
          "http://example.com-whatever/localName"
        )
      ).to.equal("localName");
    });

    it("Should extract a # name", () => {
      expect(
        LitVocabTerm.extractIriLocalName(
          "http://example.com-whatever#localName"
        )
      ).to.equal("localName");
    });
  });

  describe("String wrapper accessors", () => {
    it("Should return string values", () => {
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        getLocalStore(),
        false
      )
        .addLabel("test label", "en")
        .addComment("test comment", "en")
        .addMessage("test message", "en");

      expect(term.label).to.equal("test label");
      expect(term.comment).to.equal("test comment");
      expect(term.message).to.equal("test message");
    });
  });

  describe("is string", () => {
    it("Should determine correctly", () => {
      expect(LitVocabTerm.isString("test user name")).to.be.true;
      expect(LitVocabTerm.isString(new String("test user name").toString())).to
        .be.true;
      // @ts-ignore to enable testing error management
      expect(LitVocabTerm.isString(57)).to.be.false;
      // @ts-ignore to enable testing error management
      expect(LitVocabTerm.isString({})).to.be.false;
    });

    it("Should determine IRI correctly", () => {
      expect(LitVocabTerm.isStringIri("HTTP://xyz")).to.be.true;
      expect(LitVocabTerm.isStringIri("http://xyz")).to.be.true;
      expect(LitVocabTerm.isStringIri("HTTPS://xyz")).to.be.true;
      expect(LitVocabTerm.isStringIri("HTTPs://xyz")).to.be.true;

      expect(LitVocabTerm.isStringIri("http:/xyz")).to.be.false;
      expect(LitVocabTerm.isStringIri("HTTPs//xyz")).to.be.false;
      // @ts-ignore to enable testing error management
      expect(LitVocabTerm.isStringIri(1.99)).to.be.false;
    });
  });

  describe("Implementing RDFJS", () => {
    it("should be possible to test LitVocabTerm equality", () => {
      const store = getLocalStore();
      const aTerm = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        store,
        false
      ).addLabel("test label...", "en");
      const anotherTerm = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        store,
        false
      ).addLabel("test label...", "en");
      const aDifferentTerm = new LitVocabTerm(
        DataFactory.namedNode(`${TEST_TERM_NAME.value}_`),
        DataFactory,
        store,
        false
      ).addLabel("test label...", "en");

      expect(aTerm.equals(anotherTerm)).to.be.true;
      expect(aTerm.equals(aDifferentTerm)).to.be.false;
    });
  });

  describe("Embedding an RDFJS implementation", () => {
    it("should be possible to get a valid LitVocabTerm without providing any Datafactory", () => {
      const store = getLocalStore();
      const aTerm = buildBasicTerm(TEST_TERM_NAME, store, false).addLabel(
        "test label...",
        "en"
      );
      const anotherTerm = new LitVocabTerm(
        TEST_TERM_NAME,
        DataFactory,
        store,
        false
      ).addLabel("test label...", "en");
      expect(aTerm.equals(anotherTerm)).to.be.true;
    });

    it("should support building terms from a string", () => {
      const myTerm = buildBasicTerm(
        "http://some.vocab#myTerm",
        getLocalStore(),
        false
      ).addLabel("test label...", "en");
      expect(myTerm.iri.value).to.equal("http://some.vocab#myTerm");
    });
  });
});
