/**
 * Proprietary and Confidential
 *
 * Copyright 2020 Inrupt Inc. - all rights reserved.
 *
 * Do not use without explicit permission from Inrupt Inc.
 */

export { Store, getLocalStore, buildStore } from "./utils/localStorage";
export { LitContext, CONTEXT_KEY_LOCALE } from "./LitContext";
export { LitContextError } from "./LitContextError";
export {
  LitMultiLingualLiteral,
  NO_LANGUAGE_TAG,
} from "./LitMultiLingualLiteral";
export { LitVocabTerm, buildBasicTerm } from "./LitVocabTerm";
export { LitTermRegistry } from "./LitTermRegistry";
export type IriString = string;
