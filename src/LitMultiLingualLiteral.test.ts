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

import rdf from "@rdfjs/data-model";

import {
  LitMultiLingualLiteral,
  NO_LANGUAGE_TAG,
  RDF_LANGSTRING,
  XSD_STRING,
} from "../src/LitMultiLingualLiteral";

import chai from "chai";
const expect = chai.expect;

const TEST_IRI = rdf.namedNode(`test://iri#localName`);

describe("The RDFJS Literal implementation", () => {
  it("should return the appropriate data type", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);
    literal.addValue("no language", NO_LANGUAGE_TAG);
    expect(literal.datatype.value).equal(XSD_STRING);
    literal.addValue("whatever in Spanish", "es");
    expect(literal.asLanguage("es").datatype.value).equal(RDF_LANGSTRING);
  });

  it("should return the value (if any)", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);
    expect(literal.value).to.equal("");
    literal.addValue("no language", NO_LANGUAGE_TAG);
    expect(literal.value).to.equal("no language");
    literal.addValue("whatever in Spanish", "es");
    expect(literal.asLanguage("es").value).to.equal("whatever in Spanish");
  });

  it("should return the language (if any)", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);
    expect(literal.language).to.equal("");
    literal.addValue("no language", NO_LANGUAGE_TAG);
    expect(literal.language).to.equal("");
    literal.addValue("whatever in Spanish", "es");
    expect(literal.asLanguage("es").language).to.equal("es");
  });

  it("should be able to compare to other terms", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);
    literal.addValue("whatever no language", NO_LANGUAGE_TAG);
    expect(literal.equals(rdf.literal("whatever no language", ""))).to.be.true;
    literal.addValue("whatever in Spanish", "es");
    expect(literal.equals(rdf.literal("whatever in English", "en"))).to.be
      .false;
    expect(literal.equals(rdf.literal("whatever in English", "es"))).to.be
      .false;
    expect(literal.equals(rdf.literal("whatever in Spanish", "es"))).to.be.true;
    expect(literal.equals(literal.datatype)).to.be.false;
  });
});

describe("Constructing a litteral", () => {
  it("should preserve the provided IRI", () => {
    expect(new LitMultiLingualLiteral(rdf, TEST_IRI).getIri()).equals(TEST_IRI);
  });

  it("should default to a default context message if none is provided", () => {
    const contextualLiteral = new LitMultiLingualLiteral(
      rdf,
      TEST_IRI,
      new Map<string, string>(),
      "Some contextual message"
    );
    const nonContextualLiteral = new LitMultiLingualLiteral(
      rdf,
      TEST_IRI,
      new Map<string, string>()
    );
    expect(contextualLiteral._contextMessage).to.equal(
      "Some contextual message"
    );
    expect(nonContextualLiteral._contextMessage).to.not.be.undefined;
  });
});

describe("Adding messages", () => {
  it("Should add message, no constructor values", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);
    literal
      .addValue("whatever in Spanish", "es")
      .addValue("whatever in Irish", "ga");

    expect(literal.asLanguage("es").lookup(true)?.value).equals(
      "whatever in Spanish"
    );
    expect(literal.asLanguage("ga").lookup(true)?.value).equals(
      "whatever in Irish"
    );
  });

  it("Should add message, including constructor values", () => {
    const literal = new LitMultiLingualLiteral(
      rdf,
      TEST_IRI,
      new Map([["en", "whatever"]])
    );

    expect(literal.lookupEnglish(false)?.value).equals("whatever");

    const incorrectCall = () => literal.asLanguage("es").lookup(true);
    expect(incorrectCall).to.throw(TEST_IRI.value);
    expect(incorrectCall).to.throw("es");
    expect(incorrectCall).to.throw("none found");

    literal
      .addValue("whatever in Spanish", "es")
      .addValue("whatever in Irish", "ga");
    expect(literal.asLanguage("es").lookup(true)?.value).equals(
      "whatever in Spanish"
    );

    expect(literal.asLanguage("ga").lookup(true)?.value).equals(
      "whatever in Irish"
    );
  });
});

describe("Looking up messages", () => {
  it("Should return correct value, including with fallback", () => {
    const literal = new LitMultiLingualLiteral(
      rdf,
      TEST_IRI,
      new Map([
        ["en", "whatever"],
        ["fr", "whatever in French"],
      ])
    );

    expect(literal.lookupEnglish(false)?.value).equals("whatever");
    expect(literal.asLanguage("fr").lookup(true)?.value).equals(
      "whatever in French"
    );

    expect(literal.asLanguage("es").lookup(false)).to.deep.equal(
      rdf.literal("whatever", "en")
    );
  });

  it("Should default to English if no language", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "whatever in English",
      "en"
    );

    expect(literal.lookup(false)?.value).to.equal("whatever in English");
  });

  it("should default to a value without language if no other option is available", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "This value has no language",
      NO_LANGUAGE_TAG
    );

    expect(literal.asLanguage("es").lookup(false)?.value).to.equal(
      "This value has no language",
      "A default value should be returned"
    );
  });

  it("Should return null if not mandatory and no values at all", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);

    expect(literal.asLanguage("es").lookup(false)).to.be.undefined;
  });

  it("Should return string with param markers", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "whatever {{0}} in English {{1}}",
      "en"
    );

    expect(literal.lookup(true)?.value).to.equal(
      "whatever {{0}} in English {{1}}"
    );
  });

  it("Should fail if remaining unexpanded param placeholders", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "whatever {{0}} in English {{1}}",
      "en"
    );

    const incorrectCall = () => literal.setToEnglish.params(true, "example");
    expect(incorrectCall).to.throw(TEST_IRI.value);
    expect(incorrectCall).to.throw("en");
    expect(incorrectCall).to.throw("requires [2]");
    expect(incorrectCall).to.throw("we received [1]");
  });

  it("Should lookup literal correctly", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever {{0}} in English", "en")
      .addValue("whatever {{1}} in Irish is backwards {{0}}", "ga");

    literal.asLanguage("ga");
    expect(literal.params(true, "example", "two")).to.deep.equal(
      rdf.literal("whatever two in Irish is backwards example", "ga")
    );

    expect(literal.params(true, "example", "two")?.value).to.equal(
      "whatever two in Irish is backwards example"
    );

    expect(literal.setToEnglish.params(true, "example")).to.deep.equal(
      rdf.literal("whatever example in English", "en")
    );
  });

  it("Should lookup with no params", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever in English", "en")
      .addValue("whatever in Irish", "ga");

    expect(literal.lookup(true)).to.deep.equal(
      rdf.literal("whatever in English", "en")
    );

    expect(literal.asLanguage("ga").lookup(true)?.value).equals(
      "whatever in Irish"
    );
  });

  it("Should use English default if requested language not found", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever in English", "en")
      .addValue("whatever in Irish", "ga");

    // NOTE: our result will have an 'en' tag, even though we asked for 'fr'
    // (since we don't have a 'fr' message!).
    expect(literal.lookup(false)).to.deep.equal(
      rdf.literal("whatever in English", "en")
    );
  });

  it("Should throw with params if requested language not found", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "whatever {{0}} in English",
      "en"
    );

    const incorrectCall = () =>
      literal.asLanguage("fr").params(true, "use default");
    expect(incorrectCall).to.throw(TEST_IRI.value);
    expect(incorrectCall).to.throw("[fr]");
    expect(incorrectCall).to.throw("none found");
  });

  it("Should return undefined if params requested language not found", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);

    expect(literal.asLanguage("fr").params(false, "use default")).to.be
      .undefined;
  });

  it("Should return RDF literal using current language", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever {{0}} in English", "en")
      .addValue("whatever {{0}} in French", "fr");

    expect(literal.params(true, "use default")).to.deep.equal(
      rdf.literal("whatever use default in English", "en")
    );

    literal.asLanguage("fr");
    expect(literal.params(true, "La Vie!")).to.deep.equal(
      rdf.literal("whatever La Vie! in French", "fr")
    );
  });

  it("Should use language and params", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever {{0}} in English", "en")
      .addValue("whatever {{0}} in French", "fr");

    expect(
      literal.asLanguage("en").params(true, "use default")?.value
    ).to.equal("whatever use default in English");

    expect(literal.asLanguage("fr").params(true, "La Vie!")?.value).to.equal(
      "whatever La Vie! in French"
    );
  });
});

describe("Handling language tags", () => {
  it('should return an empty string for the "no language" tag', () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "value no language",
      NO_LANGUAGE_TAG
    );
    expect(literal.handleNoLanguageTag()).to.equal("");
  });

  it("should handle gracefully looking up an uninitialized literal", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);
    expect(literal.lookupButDefaultToEnglishOrNoLanguage(false)).to.be
      .undefined;
    expect(() => literal.lookupButDefaultToEnglishOrNoLanguage(true)).to.throw(
      "No value"
    );
  });
});
