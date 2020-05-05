/**
 * Proprietary and Confidential
 *
 * Copyright 2020 Inrupt Inc. - all rights reserved.
 *
 * Do not use without explicit permission from Inrupt Inc.
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
