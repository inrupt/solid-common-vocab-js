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

    registry.updateLabel(iri, "en", "hello labelLiteral");
    registry.updateComment(iri, "en", "hello commentLiteral");
    registry.updateMessage(iri, "en", "hello messageLiteral");

    expect(registry.lookupLabel(iri, "en")).to.equal("hello labelLiteral");
    expect(registry.lookupComment(iri, "en")).to.equal("hello commentLiteral");
    expect(registry.lookupMessage(iri, "en")).to.equal("hello messageLiteral");
  });

  it("should override an appropriate value in the registry", () => {
    const registry = new LitTermRegistry(getLocalStore());

    registry.updateLabel(iri, "en", "hello labelLiteral");
    registry.updateLabel(iri, "en", "hello again labelLiteral");

    expect(registry.lookupLabel(iri, "en")).to.equal(
      "hello again labelLiteral"
    );
  });
});

describe("LitTermRegistry lookup", () => {
  const iri = "test://iri";

  it("should return the value in the specified language if possible", () => {
    const registry = new LitTermRegistry(getLocalStore());

    registry.updateLabel(iri, "es", "holà labelLiteral");
    registry.updateComment(iri, "es", "holà commentLiteral");
    registry.updateMessage(iri, "es", "holà mensage");

    expect(registry.lookupLabel(iri, "es")).to.equal("holà labelLiteral");
    expect(registry.lookupComment(iri, "es")).to.equal("holà commentLiteral");
    expect(registry.lookupMessage(iri, "es")).to.equal("holà mensage");
  });

  it("should lookup using fallback language if the specified one misses", () => {
    const storage = getLocalStore();
    const registry = new LitTermRegistry(storage);

    storage.setItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, "es");

    registry.updateLabel(iri, "es", "holà labelLiteral");
    registry.updateComment(iri, "es", "holà commentLiteral");
    registry.updateMessage(iri, "es", "holà mensage");

    expect(registry.lookupLabel(iri, "en")).to.equal("holà labelLiteral");
    expect(registry.lookupComment(iri, "en")).to.equal("holà commentLiteral");
    expect(registry.lookupMessage(iri, "en")).to.equal("holà mensage");
  });

  it("should lookup in English upon failing using requested and fallback languages", () => {
    const storage = getLocalStore();
    const registry = new LitTermRegistry(storage);

    storage.setItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, "de");

    registry.updateLabel(iri, "es", "holà labelLiteral");
    registry.updateComment(iri, "es", "holà commentLiteral");
    registry.updateMessage(iri, "es", "holà mensage");
    registry.updateLabel(iri, "en", "hello labelLiteral");
    registry.updateComment(iri, "en", "hello commentLiteral");
    registry.updateMessage(iri, "en", "hello messageLiteral");

    expect(registry.lookupLabel(iri, "fr")).to.equal("hello labelLiteral");
    expect(registry.lookupComment(iri, "fr")).to.equal("hello commentLiteral");
    expect(registry.lookupMessage(iri, "fr")).to.equal("hello messageLiteral");
  });

  it("should lookup with no language upon failing using requested, fallback in English languages", () => {
    const storage = getLocalStore();
    const registry = new LitTermRegistry(storage);

    storage.setItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE, "de");

    registry.updateLabel(iri, NO_LANGUAGE_TAG, "holala labelLiteral");
    registry.updateComment(iri, NO_LANGUAGE_TAG, "holala commentLiteral");
    registry.updateMessage(iri, NO_LANGUAGE_TAG, "holala messageLiteral");

    expect(registry.lookupLabel(iri, "fr")).to.equal("holala labelLiteral");
    expect(registry.lookupComment(iri, "fr")).to.equal("holala commentLiteral");
    expect(registry.lookupMessage(iri, "fr")).to.equal("holala messageLiteral");
  });

  it("should return undefined if no value is available", () => {
    const storage = getLocalStore();
    const registry = new LitTermRegistry(storage);

    expect(registry.lookupLabel(iri, "fr")).to.be.undefined;
    expect(registry.lookupComment(iri, "fr")).to.be.undefined;
    expect(registry.lookupMessage(iri, "fr")).to.be.undefined;
  });
});
