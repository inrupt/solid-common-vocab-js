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

import { CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE } from "./LitContext";
import { LitTermRegistry } from "./LitTermRegistry";
import { NO_LANGUAGE_TAG } from "./LitMultiLingualLiteral";

import chai from "chai";
const expect = chai.expect;

// Prevents side-effects between tests
beforeEach(() => {
  getLocalStore().clear();
});

describe("Populating the LitTermRegistry", () => {
  const iri = "test://iri";
  it("should add an appropriate value in the registry", () => {
    const registry = new LitTermRegistry(getLocalStore());

    registry.updateLabel(iri, "en", "hello label");
    registry.updateComment(iri, "en", "hello comment");
    registry.updateMessage(iri, "en", "hello message");

    expect(registry.lookupLabel(iri, "en")).to.equal("hello label");
    expect(registry.lookupComment(iri, "en")).to.equal("hello comment");
    expect(registry.lookupMessage(iri, "en")).to.equal("hello message");
  });

  it("should override an appropriate value in the registry", () => {
    const registry = new LitTermRegistry(getLocalStore());

    registry.updateLabel(iri, "en", "hello label");
    registry.updateLabel(iri, "en", "hello again label");

    expect(registry.lookupLabel(iri, "en")).to.equal("hello again label");
  });
});

describe("LitTermRegistry lookup", () => {
  const iri = "test://iri";

  it("should return the value in the specified language if possible", () => {
    const registry = new LitTermRegistry(getLocalStore());

    registry.updateLabel(iri, "es", "holà label");
    registry.updateComment(iri, "es", "holà comment");
    registry.updateMessage(iri, "es", "holà mensage");

    expect(registry.lookupLabel(iri, "es")).to.equal("holà label");
    expect(registry.lookupComment(iri, "es")).to.equal("holà comment");
    expect(registry.lookupMessage(iri, "es")).to.equal("holà mensage");
  });

  it("should lookup using fallback language if the specified one misses", () => {
    const storage = getLocalStore();
    const registry = new LitTermRegistry(storage);

    storage.setItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, "es");

    registry.updateLabel(iri, "es", "holà label");
    registry.updateComment(iri, "es", "holà comment");
    registry.updateMessage(iri, "es", "holà mensage");

    expect(registry.lookupLabel(iri, "en")).to.equal("holà label");
    expect(registry.lookupComment(iri, "en")).to.equal("holà comment");
    expect(registry.lookupMessage(iri, "en")).to.equal("holà mensage");
  });

  it("should lookup in English upon failing using requested and fallback languages", () => {
    const storage = getLocalStore();
    const registry = new LitTermRegistry(storage);

    storage.setItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, "de");

    registry.updateLabel(iri, "es", "holà label");
    registry.updateComment(iri, "es", "holà comment");
    registry.updateMessage(iri, "es", "holà mensage");
    registry.updateLabel(iri, "en", "hello label");
    registry.updateComment(iri, "en", "hello comment");
    registry.updateMessage(iri, "en", "hello message");

    expect(registry.lookupLabel(iri, "fr")).to.equal("hello label");
    expect(registry.lookupComment(iri, "fr")).to.equal("hello comment");
    expect(registry.lookupMessage(iri, "fr")).to.equal("hello message");
  });

  it("should lookup with no language upon failing using requested, fallback in English languages", () => {
    const storage = getLocalStore();
    const registry = new LitTermRegistry(storage);

    storage.setItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, "de");

    registry.updateLabel(iri, NO_LANGUAGE_TAG, "holala label");
    registry.updateComment(iri, NO_LANGUAGE_TAG, "holala comment");
    registry.updateMessage(iri, NO_LANGUAGE_TAG, "holala message");

    expect(registry.lookupLabel(iri, "fr")).to.equal("holala label");
    expect(registry.lookupComment(iri, "fr")).to.equal("holala comment");
    expect(registry.lookupMessage(iri, "fr")).to.equal("holala message");
  });

  it("should return undefined if no value is available", () => {
    const storage = getLocalStore();
    const registry = new LitTermRegistry(storage);

    expect(registry.lookupLabel(iri, "fr")).to.be.undefined;
    expect(registry.lookupComment(iri, "fr")).to.be.undefined;
    expect(registry.lookupMessage(iri, "fr")).to.be.undefined;
  });
});
