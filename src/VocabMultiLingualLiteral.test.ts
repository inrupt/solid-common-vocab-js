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

import { DataFactory } from "rdf-js";
import { DataFactory as DataFactoryImpl } from "rdf-data-factory";

import {
  VocabMultiLingualLiteral,
  NO_LANGUAGE_TAG,
  RDF_LANGSTRING,
  XSD_STRING,
} from "../src/VocabMultiLingualLiteral";

import expect from "expect";

const rdfFactory: DataFactory = new DataFactoryImpl();
const TEST_IRI = rdfFactory.namedNode(`test://iri#localName`);

describe("The RDFJS Literal implementation", () => {
  it("should return the appropriate data type", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI);
    literal.addValue("no language", NO_LANGUAGE_TAG);
    expect(literal.datatype.value).toBe(XSD_STRING);
    literal.addValue("whatever in Spanish", "es");
    expect(literal.asLanguage("es").datatype.value).toBe(RDF_LANGSTRING);
  });

  it("should return the value (if any)", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI);
    expect(literal.value).toBe("");
    literal.addValue("no language", NO_LANGUAGE_TAG);
    expect(literal.value).toBe("no language");
    literal.addValue("whatever in Spanish", "es");
    expect(literal.asLanguage("es").value).toBe("whatever in Spanish");
  });

  it("should return the language (if any)", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI);
    expect(literal.language).toBe("");
    literal.addValue("no language", NO_LANGUAGE_TAG);
    expect(literal.language).toBe("");
    literal.addValue("whatever in Spanish", "es");
    expect(literal.asLanguage("es").language).toBe("es");
  });

  it("should be able to compare to other terms", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI);
    literal.addValue("whatever no language", NO_LANGUAGE_TAG);
    expect(literal.equals(rdfFactory.literal("whatever no language", ""))).toBe(
      true
    );
    literal.addValue("whatever in Spanish", "es");
    expect(
      literal.equals(rdfFactory.literal("whatever in English", "en"))
    ).toBe(false);
    expect(
      literal.equals(rdfFactory.literal("whatever in English", "es"))
    ).toBe(false);
    expect(
      literal.equals(rdfFactory.literal("whatever in Spanish", "es"))
    ).toBe(true);
    expect(literal.equals(literal.datatype)).toBe(false);
  });
});

describe("Constructing a litteral", () => {
  it("should preserve the provided IRI", () => {
    expect(new VocabMultiLingualLiteral(rdfFactory, TEST_IRI).getIri()).toBe(
      TEST_IRI
    );
  });

  it("should default to a default context message if none is provided", () => {
    const contextualLiteral = new VocabMultiLingualLiteral(
      rdfFactory,
      TEST_IRI,
      new Map<string, string>(),
      "Some contextual message"
    );
    const nonContextualLiteral = new VocabMultiLingualLiteral(
      rdfFactory,
      TEST_IRI,
      new Map<string, string>()
    );
    expect(contextualLiteral._contextMessage).toBe("Some contextual message");
    expect(nonContextualLiteral._contextMessage).toBeDefined();
  });
});

describe("Adding messages", () => {
  it("Should add message, no constructor values", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI);
    literal
      .addValue("whatever in Spanish", "es")
      .addValue("whatever in Irish", "ga");

    expect(literal.asLanguage("es").lookup(true)?.value).toBe(
      "whatever in Spanish"
    );
    expect(literal.asLanguage("ga").lookup(true)?.value).toBe(
      "whatever in Irish"
    );
  });

  it("Should add message, including constructor values", () => {
    const literal = new VocabMultiLingualLiteral(
      rdfFactory,
      TEST_IRI,
      new Map([["en", "whatever"]])
    );

    expect(literal.lookupEnglish(false)?.value).toBe("whatever");

    const incorrectCall = () => literal.asLanguage("es").lookup(true);
    expect(incorrectCall).toThrowError(TEST_IRI.value);
    expect(incorrectCall).toThrowError("es");
    expect(incorrectCall).toThrowError("none found");

    literal
      .addValue("whatever in Spanish", "es")
      .addValue("whatever in Irish", "ga");
    expect(literal.asLanguage("es").lookup(true)?.value).toBe(
      "whatever in Spanish"
    );

    expect(literal.asLanguage("ga").lookup(true)?.value).toBe(
      "whatever in Irish"
    );
  });
});

describe("Looking up messages", () => {
  it("Should return correct value, including with fallback", () => {
    const literal = new VocabMultiLingualLiteral(
      rdfFactory,
      TEST_IRI,
      new Map([
        ["en", "whatever"],
        ["fr", "whatever in French"],
      ])
    );

    expect(literal.lookupEnglish(false)?.value).toBe("whatever");
    expect(literal.asLanguage("fr").lookup(true)?.value).toBe(
      "whatever in French"
    );

    expect(literal.asLanguage("es").lookup(false)).toEqual(
      rdfFactory.literal("whatever", "en")
    );
  });

  it("Should default to English if no language", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI).addValue(
      "whatever in English",
      "en"
    );

    expect(literal.lookup(false)?.value).toBe("whatever in English");
  });

  it("should default to a value without language if no other option is available", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI).addValue(
      "This value has no language",
      NO_LANGUAGE_TAG
    );

    expect(literal.asLanguage("es").lookup(false)?.value).toBe(
      "This value has no language"
    );
  });

  it("Should return null if not mandatory and no values at all", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI);

    expect(literal.asLanguage("es").lookup(false)).toBeUndefined();
  });

  it("Should return string with param markers", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI).addValue(
      "whatever {{0}} in English {{1}}",
      "en"
    );

    expect(literal.lookup(true)?.value).toBe("whatever {{0}} in English {{1}}");
  });

  it("Should fail if remaining unexpanded param placeholders", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI).addValue(
      "whatever {{0}} in English {{1}}",
      "en"
    );

    const incorrectCall = () => literal.setToEnglish.params(true, "example");
    expect(incorrectCall).toThrowError(TEST_IRI.value);
    expect(incorrectCall).toThrowError("en");
    expect(incorrectCall).toThrowError("requires [2]");
    expect(incorrectCall).toThrowError("we received [1]");
  });

  it("Should lookup literal correctly", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI)
      .addValue("whatever {{0}} in English", "en")
      .addValue("whatever {{1}} in Irish is backwards {{0}}", "ga");

    literal.asLanguage("ga");
    expect(literal.params(true, "example", "two")).toEqual(
      rdfFactory.literal("whatever two in Irish is backwards example", "ga")
    );

    expect(literal.params(true, "example", "two")?.value).toBe(
      "whatever two in Irish is backwards example"
    );

    expect(literal.setToEnglish.params(true, "example")).toEqual(
      rdfFactory.literal("whatever example in English", "en")
    );
  });

  it("Should lookup with no params", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI)
      .addValue("whatever in English", "en")
      .addValue("whatever in Irish", "ga");

    expect(literal.lookup(true)).toEqual(
      rdfFactory.literal("whatever in English", "en")
    );

    expect(literal.asLanguage("ga").lookup(true)?.value).toBe(
      "whatever in Irish"
    );
  });

  it("Should use English default if requested language not found", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI)
      .addValue("whatever in English", "en")
      .addValue("whatever in Irish", "ga");

    // NOTE: our result will have an 'en' tag, even though we asked for 'fr'
    // (since we don't have a 'fr' message!).
    expect(literal.lookup(false)).toEqual(
      rdfFactory.literal("whatever in English", "en")
    );
  });

  it("Should throw with params if requested language not found", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI).addValue(
      "whatever {{0}} in English",
      "en"
    );

    const incorrectCall = () =>
      literal.asLanguage("fr").params(true, "use default");
    expect(incorrectCall).toThrowError(TEST_IRI.value);
    expect(incorrectCall).toThrowError("[fr]");
    expect(incorrectCall).toThrowError("none found");
  });

  it("Should return undefined if params requested language not found", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI);

    expect(
      literal.asLanguage("fr").params(false, "use default")
    ).toBeUndefined();
  });

  it("Should return RDF literal using current language", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI)
      .addValue("whatever {{0}} in English", "en")
      .addValue("whatever {{0}} in French", "fr");

    expect(literal.params(true, "use default")).toEqual(
      rdfFactory.literal("whatever use default in English", "en")
    );

    literal.asLanguage("fr");
    expect(literal.params(true, "La Vie!")).toEqual(
      rdfFactory.literal("whatever La Vie! in French", "fr")
    );
  });

  it("Should use language and params", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI)
      .addValue("whatever {{0}} in English", "en")
      .addValue("whatever {{0}} in French", "fr");

    expect(literal.asLanguage("en").params(true, "use default")?.value).toBe(
      "whatever use default in English"
    );

    expect(literal.asLanguage("fr").params(true, "La Vie!")?.value).toBe(
      "whatever La Vie! in French"
    );
  });
});

describe("Handling language tags", () => {
  it('should return an empty string for the "no language" tag', () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI).addValue(
      "value no language",
      NO_LANGUAGE_TAG
    );
    expect(literal.handleNoLanguageTag()).toBe("");
  });

  it("should handle gracefully looking up an uninitialized literal", () => {
    const literal = new VocabMultiLingualLiteral(rdfFactory, TEST_IRI);
    expect(
      literal.lookupButDefaultToEnglishOrNoLanguage(false)
    ).toBeUndefined();
    expect(() =>
      literal.lookupButDefaultToEnglishOrNoLanguage(true)
    ).toThrowError("No value");
  });
});
