import rdf from "@rdfjs/data-model";

import {
  LitMultiLingualLiteral,
  NO_LANGUAGE_TAG,
} from "../src/LitMultiLingualLiteral";

import chai from "chai";
const expect = chai.expect;

const TEST_IRI = "test://iri#localName";

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

    expect(literal.asLanguage("es").lookup(false, true)).equals(
      "whatever in Spanish"
    );
    expect(literal.asLanguage("ga").lookup(false, true)).equals(
      "whatever in Irish"
    );
  });

  it("Should add message, including constructor values", () => {
    const literal = new LitMultiLingualLiteral(
      rdf,
      TEST_IRI,
      new Map([["en", "whatever"]])
    );

    expect(literal.lookupEnglish(false, false)).equals("whatever");

    const incorrectCall = () => literal.asLanguage("es").lookup(false, true);
    expect(incorrectCall).to.throw(TEST_IRI);
    expect(incorrectCall).to.throw("es");
    expect(incorrectCall).to.throw("none found");

    literal
      .addValue("whatever in Spanish", "es")
      .addValue("whatever in Irish", "ga");
    expect(literal.asLanguage("es").lookup(false, true)).equals(
      "whatever in Spanish"
    );

    expect(literal.asLanguage("ga").lookup(false, true)).equals(
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

    expect(literal.lookupEnglish(false, false)).equals("whatever");
    expect(literal.asLanguage("fr").lookup(false, true)).equals(
      "whatever in French"
    );

    expect(literal.asLanguage("es").lookup(true, false)).to.deep.equal(
      rdf.literal("whatever", "en")
    );
  });

  it("Should default to English if no language", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "whatever in English",
      "en"
    );

    expect(literal.lookup(false, false)).to.equal("whatever in English");
  });

  it("should default to a value without language if no other option is available", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "This value has no language",
      NO_LANGUAGE_TAG
    );

    expect(literal.asLanguage("es").lookup(false, false)).to.equal(
      "This value has no language",
      "A default value should be returned"
    );
  });

  it("Should return null if not mandatory and no values at all", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);

    expect(literal.asLanguage("es").lookup(false, false)).to.be.undefined;
  });

  it("Should return string with param markers", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "whatever {{0}} in English {{1}}",
      "en"
    );

    expect(literal.lookup(false, true)).to.equal(
      "whatever {{0}} in English {{1}}"
    );
  });

  it("Should fail if remaining unexpanded param placeholders", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "whatever {{0}} in English {{1}}",
      "en"
    );

    const incorrectCall = () =>
      literal.setToEnglish.params(true, true, "example");
    expect(incorrectCall).to.throw(TEST_IRI);
    expect(incorrectCall).to.throw("en");
    expect(incorrectCall).to.throw("requires [2]");
    expect(incorrectCall).to.throw("we received [1]");
  });

  it("Should lookup literal correctly", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever {{0}} in English", "en")
      .addValue("whatever {{1}} in Irish is backwards {{0}}", "ga");

    literal.asLanguage("ga");
    expect(literal.params(true, true, "example", "two")).to.deep.equal(
      rdf.literal("whatever two in Irish is backwards example", "ga")
    );

    expect(literal.params(false, true, "example", "two")).to.equal(
      "whatever two in Irish is backwards example"
    );

    expect(literal.setToEnglish.params(true, true, "example")).to.deep.equal(
      rdf.literal("whatever example in English", "en")
    );
  });

  it("Should lookup with no params", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever in English", "en")
      .addValue("whatever in Irish", "ga");

    expect(literal.lookup(true, true)).to.deep.equal(
      rdf.literal("whatever in English", "en")
    );

    expect(literal.asLanguage("ga").lookup(false, true)).equals(
      "whatever in Irish"
    );
  });

  it("Should use English default if requested language not found", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever in English", "en")
      .addValue("whatever in Irish", "ga");

    // NOTE: our result will have an 'en' tag, even though we asked for 'fr'
    // (since we don't have a 'fr' message!).
    expect(literal.lookup(true, false)).to.deep.equal(
      rdf.literal("whatever in English", "en")
    );
  });

  it("Should throw with params if requested language not found", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI).addValue(
      "whatever {{0}} in English",
      "en"
    );

    const incorrectCall = () =>
      literal.asLanguage("fr").params(true, true, "use default");
    expect(incorrectCall).to.throw(TEST_IRI);
    expect(incorrectCall).to.throw("[fr]");
    expect(incorrectCall).to.throw("none found");
  });

  it("Should return undefined if params requested language not found", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI);

    expect(literal.asLanguage("fr").params(true, false, "use default")).to.be
      .undefined;
  });

  it("Should return RDF literal using current language", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever {{0}} in English", "en")
      .addValue("whatever {{0}} in French", "fr");

    expect(literal.params(true, true, "use default")).to.deep.equal(
      rdf.literal("whatever use default in English", "en")
    );

    literal.asLanguage("fr");
    expect(literal.params(true, true, "La Vie!")).to.deep.equal(
      rdf.literal("whatever La Vie! in French", "fr")
    );
  });

  it("Should use language and params", () => {
    const literal = new LitMultiLingualLiteral(rdf, TEST_IRI)
      .addValue("whatever {{0}} in English", "en")
      .addValue("whatever {{0}} in French", "fr");

    expect(
      literal.asLanguage("en").params(false, true, "use default")
    ).to.equal("whatever use default in English");

    expect(literal.asLanguage("fr").params(false, true, "La Vie!")).to.equal(
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
