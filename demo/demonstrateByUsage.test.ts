/**
 * Proprietary and Confidential
 *
 * Copyright 2020 Inrupt Inc. - all rights reserved.
 *
 * Do not use without explicit permission from Inrupt Inc.
 */

import rdf from "@rdfjs/data-model";

import { getLocalStore } from "../src/utils/localStorage";
import { LitContext, CONTEXT_KEY_LOCALE } from "../src/LitContext";
import { LitVocabTerm, buildBasicTerm } from "../src/LitVocabTerm";

const chai = require("chai");
const expect = chai.expect;

/**
 * Test class intended to demonstrate by example how to use LIT Vocab Term
 * instances. This class is not intended to contribute to test coverage, and
 * duplicates test conditions in our standard unit tests.
 *
 * We'll use this Turtle snippet to help illustrate some of the usage patterns
 * below, with the term 'ex:name' defined in our tests as the constant
 * 'TEST_TERM_NAME'.
 *
 *   prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
 *   prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
 *   prefix skos: <http://www.w3.org/2004/02/skos/core#>
 *   prefix test:   <https://test.com/vocab#>
 *
 *   test:name a rdf:Property ;
 *     rdfs:label "Name" ;
 *     rdfs:label "First name"@en ;
 *     rdfs:label "Prénom"@fr ;
 *     rdfs:comment "A person's first name"@en ,
 *                  "Nombre de una persona"@es ,
 *                  "Prénom d'une personne"@fr .
 *
 *   test:errNameTooLong a rdfs:Literal ;
 *     skos:definition "Name must be less than {{0}}, but we got {{1}}"@en .
 *
 */
describe("Demonstrate LIT Vocab Term usage", () => {
  const TEST_TERM_NAME_PATH = "name";
  const TEST_TERM_NAME = rdf.namedNode(
    `https://test.com/vocab#${TEST_TERM_NAME_PATH}`
  );

  const TEST_TERM_ERROR = rdf.namedNode(`https://test.com/vocab#errSomeError`);

  // Vocab Term labels can be configured (via a constructor parameter) to
  // fallback to using the path component of the term IRI as the English label
  // if there is no English value provided and no no-language value. We refer to
  // this mode of operation as 'unstrict' mode, and it's very useful when
  // working with LIT Vocab Terms generated from vocabularies you have no
  // control over, and which do not already provide labels for their terms,
  // i.e. in those cases you can still provide what will hopefully be
  // meaningful and useful labels.

  describe("LIT Vocab Term label usage", () => {
    it("Label handling allowing local part of IRI as fallback English value", () => {
      // We explicitly want our term to allow the use of the local part of
      // the IRI as the English label if no English label is provided
      // explicitly, so we pass 'false' for the 'strict' flag (as 'strict'
      // enforces that an explicit English label be provided!).
      // Here we're simply creating the term itself, and not yet add any labels,
      // comments or messages.
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        rdf,
        getLocalStore(),
        false
      );

      // Simply requesting the label now without an explicit language assumes
      // English, but since we haven't provided any labels at all yet, all we
      // can return is the local path of the IRI (which we explicitly allow by
      // stating in the term's constructor that we're not being 'strict').

      // NOTE: the expected return type is an LIT Literal object telling us not
      // just the text of the label, but also the language tag for this text,
      // and potentially a datatype (and (NOT IMPLEMENTED YET!) even extra
      // information that can explain fallback behaviour we may have taken, e.g.
      // that a specifically requested language for a label wasn't found, but
      // but that we fell back to providing the English label instead (which
      // could be really useful in a UI tooltip for instance).

      // NOTE: the language tag on the returned LIT Literal object here is empty
      // (i.e. the value is of type XSD:string) meaning a string with no
      // language component at all. This makes sense in our case because the
      // local part of an IRI would not be expected to be language-specific.
      expect(term.labelLiteral).to.deep.equal(
        rdf.literal(TEST_TERM_NAME_PATH, "")
      );

      // If we only want the text value of the label, we can explicitly ask
      // for only that using '.value' (which comes from the RDFJS interfaces).
      expect(term.label).to.equal(TEST_TERM_NAME_PATH);

      // Explicitly saying that a value is mandatory will throw an exception
      // (regardless of 'strict-ness') if no value can be found.
      expect(() => term.mandatory.label).to.throw(TEST_TERM_NAME.value);

      // When we explicitly request French, but we still have no labels at all,
      // we'll return the IRI's local name by default (since our term was
      // created with 'unstrict' mode).
      expect(term.asLanguage("fr").label).to.equal(TEST_TERM_NAME_PATH);

      // Now we'll add a label in French.
      term.addLabel("Prénom", "fr");

      // But we still get back the local name if we don't request a specific
      // language, and there is still no English or no-language tag label.
      expect(term.label).to.equal(TEST_TERM_NAME_PATH);

      // But if we now explicitly ask for French, we'll get the French LIT
      // Literal object.
      expect(term.asLanguage("fr").labelLiteral).to.deep.equal(
        rdf.literal("Prénom", "fr")
      );

      // ...or if we just want the French label as a string...
      expect(term.asLanguage("fr").label).to.equal("Prénom");

      // Now we add a label without any language at all...
      term.addLabelNoLanguage("No language NAME");

      // ... we'll get that no-language value back when no specific language
      // is requested, since there is still no explicitly English-tagged label.
      expect(term.label).to.equal("No language NAME");

      // And requesting a mandatory value will still throw an exception.
      expect(() => term.mandatory.label).to.throw(TEST_TERM_NAME.value);

      // If we provide a value explicitly tagged as 'English'...
      const englishLabel = "Label in English - Name";
      term.addLabel(englishLabel, "en");

      // ...then we'll get that value back without needing to provide an
      // explicit language at all...
      expect(term.label).to.equal(englishLabel);

      // ...or if we explicitly request English...
      expect(term.asLanguage("en").label).to.equal(englishLabel);

      // ...or if we use our convenience '.asEnglish' accessor.
      expect(term.asEnglish.label).to.equal(englishLabel);

      // And making it mandatory should be fine too...
      expect(term.mandatory.label).to.equal(englishLabel);

      // When we now ask for a non-existent language label (in this case
      // German), this time it should fallback to the English label.
      expect(term.asLanguage("de").label).equals(englishLabel);
    });

    it("Label handling WITHOUT allowing local part of IRI as fallback", () => {
      // Here we explicitly prevent our term from using the local path of
      // the IRI as the English label if no English label is explicitly
      // provided (i.e. we set the 'strict' flag to 'true').
      // This is useful when we control the generation of vocab terms, since we
      // can enforce that all terms must have at least English labels and
      // comments (this is something that the LIT Artifact Generator can enforce
      // today for example).
      const term = new LitVocabTerm(TEST_TERM_NAME, rdf, getLocalStore(), true);

      // Simply requesting the label without an explicit language assumes
      // English, but since we haven't provided any labels at all we get
      // 'undefined' for strict terms.
      expect(term.label).to.be.undefined;

      // Asking for a mandatory label of a 'strict' term when there are no
      // matching labels throws an exception instead of returning 'undefined'.
      expect(() => term.mandatory.label).to.throw(TEST_TERM_NAME.value);

      // Now we add a non-English language label...
      const labelInIrish = "Ainm";
      term.addLabel(labelInIrish, "ga");

      // Getting the value without providing a language still throws (since we
      // have no default (i.e. English) value)...
      expect(term.label).to.be.undefined;

      // But looking specifically for our new language label works fine.
      expect(term.asLanguage("ga").label).to.equal(labelInIrish);

      // Now we explicitly add an English label...
      const englishLabel = "Label in English - Name";
      term.addLabel(englishLabel, "en");

      // By default we'll get our English label, of course...
      expect(term.label).to.equal(englishLabel);

      // But now when we ask for a non-existent language label, this time we
      // should fallback to the English label...
      expect(term.asLanguage("fr").label).equals(englishLabel);
    });

    it("Show language coming from context", () => {
      const storage = getLocalStore();
      // Create a vocab term with a non-English language label (in this case
      // Irish, and using the 'strict' mode).
      const labelInIrish = "Ainm";
      const term = new LitVocabTerm(
        TEST_TERM_NAME,
        rdf,
        storage,
        true
      ).addLabel(labelInIrish, "ga");

      // First show that by default we can't find any label values at all
      // (because we created our term in 'strict' mode, meaning we won't
      // fallback to using the path of the term's IRI)...
      expect(term.label).to.be.undefined;

      // Now set the context language to Irish...
      storage.setItem(CONTEXT_KEY_LOCALE, "ga");

      // ..and now our default will return our Irish label LIT Literal object.
      expect(term.labelLiteral).to.deep.equal(rdf.literal(labelInIrish, "ga"));

      // ...or, as before, just the label text if we ask for just the value.
      expect(term.label).equals(labelInIrish);
    });
  });

  /**
   * Here we use the 'strict' flag on our vocab terms, which enforces the
   * expectation that the term will have at least an English label and
   * comment, and therefore will never use the IRI's path as the label - it will
   * return 'undefined' (or throw an exception if '.mandatory') instead.
   */
  describe("Strict support", () => {
    it("Should not use IRI path if no label and strict", () => {
      const term = new LitVocabTerm(TEST_TERM_NAME, rdf, getLocalStore(), true);

      // Won't fallback to use IRI path - just returns 'undefined'.
      expect(term.label).to.be.undefined;

      // ...or throws an exception if mandatory is stipulated.
      expect(() => term.mandatory.label).to.throw(TEST_TERM_NAME.value);
    });

    it("Should still fallback to English if language not found", () => {
      const term = new LitVocabTerm(TEST_TERM_NAME, rdf, getLocalStore(), true)
        .addLabel(`First name`, "en")
        .addComment(`English comment...`, "en");

      // Here we ask for French (which we didn't provide), so we fallback to
      // the English values we did provide...
      expect(term.asLanguage("fr").label).equals(`First name`);
      expect(term.asLanguage("fr").comment).equals(`English comment...`);
    });

    it("Should require explicitly English label and comment if mandatory", () => {
      const term = new LitVocabTerm(TEST_TERM_NAME, rdf, getLocalStore(), true)
        .addLabelNoLanguage(`No-language label isn't enough for 'mandatory'...`)
        .addCommentNoLanguage(
          `No-language comment isn't enough for 'mandatory'...`
        );

      expect(() => term.mandatory.label).to.throw(TEST_TERM_NAME.value);
      expect(() => term.mandatory.comment).to.throw(TEST_TERM_NAME.value);
    });
  });

  // Comments and messages do not fallback to using the IRI's local name.
  describe("LIT Vocab Term comment or message usage", () => {
    it("Comment and message do not fallback to using the IRIs local name", () => {
      const termStrict = new LitVocabTerm(
        TEST_TERM_NAME,
        rdf,
        getLocalStore(),
        true
      );

      // By default, with no comments or messages added, we expect to get
      // back 'undefined'...
      expect(termStrict.comment).to.be.undefined;
      expect(termStrict.message).to.be.undefined;

      // But if we specify mandatory, we get exceptions instead.
      expect(() => termStrict.mandatory.comment).to.throw(TEST_TERM_NAME.value);
      expect(() => termStrict.mandatory.message).to.throw(TEST_TERM_NAME.value);

      // Same behaviour for unstrict terms.
      const termUnstrict = new LitVocabTerm(
        TEST_TERM_NAME,
        rdf,
        getLocalStore(),
        false
      );
      expect(termUnstrict.comment).to.be.undefined;
      expect(termUnstrict.message).to.be.undefined;

      expect(() => termUnstrict.mandatory.comment).to.throw(
        TEST_TERM_NAME.value
      );
      expect(() => termUnstrict.mandatory.message).to.throw(
        TEST_TERM_NAME.value
      );
    });

    it("Message with no parameters", () => {
      const englishMessage = "Some message with no parameters...";
      const germanMessage = "Eine Nachricht ohne Parameter...";
      const term = new LitVocabTerm(TEST_TERM_ERROR, rdf, getLocalStore(), true)
        .addMessage(englishMessage, "en")
        .addMessage(germanMessage, "de");

      expect(term.message).to.equal(englishMessage);
      expect(term.asLanguage("de").message).to.equal(germanMessage);

      // Non-existent language value will fallback to English...
      expect(term.asLanguage("fr").message).to.equal(englishMessage);

      // But if we look for the message with an incorrect number of parameters
      // (in this case our message has zero), we'll get an exception.
      expect(() =>
        term.mandatory.messageParamsLiteral("too many params")
      ).to.throw(TEST_TERM_ERROR.value);
    });

    it("Message with parameters", () => {
      const englishMessage = "Message with {{0}}, {{1}} params";
      const germanMessage =
        "Unterschiedliche Reihenfolge {{1}} und dann {{0}} Parameter";
      const term = new LitVocabTerm(TEST_TERM_ERROR, rdf, getLocalStore(), true)
        .addMessage(englishMessage, "en")
        .addMessage(germanMessage, "de");

      expect(term.messageParams("one", "two")).to.equal(
        "Message with one, two params"
      );

      // We can freely move parameters around in the message text, as
      // illustrated in our German translation...
      expect(term.asLanguage("de").messageParams("one", "two")).to.equal(
        "Unterschiedliche Reihenfolge two und dann one Parameter"
      );

      // ...and again, if we make it mandatory and pass the incorrect number of
      // parameters, we get an exception.
      expect(() => term.mandatory.messageParams("too few params")).to.throw(
        TEST_TERM_ERROR.value
      );
    });
  });
});
