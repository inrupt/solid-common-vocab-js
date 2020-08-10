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

import { getLocalStore } from "./util/localStorage";

import { CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE } from "./VocabContext";
import { VocabTermRegistry } from "./VocabTermRegistry";
import { NO_LANGUAGE_TAG } from "./VocabMultiLingualLiteral";

import expect from "expect";

// Prevents side-effects between tests
beforeEach(() => {
  getLocalStore().clear();
});

describe("Populating the VocabTermRegistry", () => {
  const iri = "test://iri";
  it("should add an appropriate value in the registry", () => {
    const registry = new VocabTermRegistry(getLocalStore());

    registry.updateLabel(iri, "en", "hello label");
    registry.updateComment(iri, "en", "hello comment");
    registry.updateMessage(iri, "en", "hello message");

    expect(registry.lookupLabel(iri, "en")).toBe("hello label");
    expect(registry.lookupComment(iri, "en")).toBe("hello comment");
    expect(registry.lookupMessage(iri, "en")).toBe("hello message");
  });

  it("should override an appropriate value in the registry", () => {
    const registry = new VocabTermRegistry(getLocalStore());

    registry.updateLabel(iri, "en", "hello label");
    registry.updateLabel(iri, "en", "hello again label");

    expect(registry.lookupLabel(iri, "en")).toBe("hello again label");
  });
});

describe("VocabTermRegistry lookup", () => {
  const iri = "test://iri";

  it("should return the value in the specified language if possible", () => {
    const registry = new VocabTermRegistry(getLocalStore());

    registry.updateLabel(iri, "es", "holà label");
    registry.updateComment(iri, "es", "holà comment");
    registry.updateMessage(iri, "es", "holà mensage");

    expect(registry.lookupLabel(iri, "es")).toBe("holà label");
    expect(registry.lookupComment(iri, "es")).toBe("holà comment");
    expect(registry.lookupMessage(iri, "es")).toBe("holà mensage");
  });

  it("should lookup using fallback language if the specified one misses", () => {
    const storage = getLocalStore();
    const registry = new VocabTermRegistry(storage);

    storage.setItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, "es");

    registry.updateLabel(iri, "es", "holà label");
    registry.updateComment(iri, "es", "holà comment");
    registry.updateMessage(iri, "es", "holà mensage");

    expect(registry.lookupLabel(iri, "en")).toBe("holà label");
    expect(registry.lookupComment(iri, "en")).toBe("holà comment");
    expect(registry.lookupMessage(iri, "en")).toBe("holà mensage");
  });

  it("should lookup in English upon failing using requested and fallback languages", () => {
    const storage = getLocalStore();
    const registry = new VocabTermRegistry(storage);

    storage.setItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, "de");

    registry.updateLabel(iri, "es", "holà label");
    registry.updateComment(iri, "es", "holà comment");
    registry.updateMessage(iri, "es", "holà mensage");
    registry.updateLabel(iri, "en", "hello label");
    registry.updateComment(iri, "en", "hello comment");
    registry.updateMessage(iri, "en", "hello message");

    expect(registry.lookupLabel(iri, "fr")).toBe("hello label");
    expect(registry.lookupComment(iri, "fr")).toBe("hello comment");
    expect(registry.lookupMessage(iri, "fr")).toBe("hello message");
  });

  it("should lookup with no language upon failing using requested, fallback in English languages", () => {
    const storage = getLocalStore();
    const registry = new VocabTermRegistry(storage);

    storage.setItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, "de");

    registry.updateLabel(iri, NO_LANGUAGE_TAG, "holala label");
    registry.updateComment(iri, NO_LANGUAGE_TAG, "holala comment");
    registry.updateMessage(iri, NO_LANGUAGE_TAG, "holala message");

    expect(registry.lookupLabel(iri, "fr")).toBe("holala label");
    expect(registry.lookupComment(iri, "fr")).toBe("holala comment");
    expect(registry.lookupMessage(iri, "fr")).toBe("holala message");
  });

  it("should return undefined if no value is available", () => {
    const storage = getLocalStore();
    const registry = new VocabTermRegistry(storage);

    expect(registry.lookupLabel(iri, "fr")).toBeUndefined();
    expect(registry.lookupComment(iri, "fr")).toBeUndefined();
    expect(registry.lookupMessage(iri, "fr")).toBeUndefined();
  });
});
