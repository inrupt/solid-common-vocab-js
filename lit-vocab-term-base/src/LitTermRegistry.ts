import debug from "debug";
const DEBUG_NS = "lit-vocab-term:LitTermRegistry";

import { IStore, CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE } from "./LitContext";
import { NO_LANGUAGE_TAG } from "./LitMultiLingualLiteral";

/**
 * Simple registry of terms (and their associated meta-data (like labels,
 * comment, message)) in multiple languages.
 *
 * We use localStorage to store all term meta-data, which can only store
 * strings (so we need to expand out the meta-data for each term).
 */
class LitTermRegistry {
  private store: IStore;

  constructor(store: IStore) {
    this.store = store;
  }

  lookupLabel(termIri: string, language: string) {
    return this.lookupItem(termIri, language, "label");
  }

  updateLabel(termIri: string, language: string, label: string) {
    this.updateItem(termIri, language, label, "label");
  }

  lookupComment(termIri: string, language: string) {
    return this.lookupItem(termIri, language, "comment");
  }

  updateComment(termIri: string, language: string, label: string) {
    this.updateItem(termIri, language, label, "comment");
  }

  lookupMessage(termIri: string, language: string) {
    return this.lookupItem(termIri, language, "message");
  }

  updateMessage(termIri: string, language: string, label: string) {
    this.updateItem(termIri, language, label, "message");
  }

  private updateItem(
    termIri: string,
    language: string,
    label: string,
    item: string
  ) {
    this.store.setItem(`${termIri}-${item}-${language}`, label);
  }

  private lookupItem(termIri: string, language: string, item: string) {
    return this.lookupFullTerm(`${termIri}-${item}-`, language);
  }

  /**
   * Looks up the specified vocabulary term in the specified language. If no
   * value found, will lookup again using the fallback language (as set in our
   * context). If not found again, will fallback to looking up the term in
   * English.
   *
   * @param term
   * @param language
   * @returns {string}
   */
  lookupFullTerm(term: string, language: string): string | undefined {
    const fallbackLanguage =
      this.store.getItem(CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE) || "en";

    return this.lookupFullTermFallback(term, language, [
      fallbackLanguage,
      "en",
      NO_LANGUAGE_TAG,
    ]);
  }

  /**
   * Looks up the specified vocabulary term in the specified language. If no
   * value found, will lookup again using the provided fallback values one by
   * one until a value is found or there are no additional fallbacks.
   *
   * @param term {string}
   * @param language {string}
   * @param fallback {string[]}
   *
   * @returns {string | undefined}
   */
  lookupFullTermFallback(
    term: string,
    language: string,
    fallback: string[]
  ): string | undefined {
    let result = this.store.getItem(`${term}${language}`);

    if (result) {
      return result;
    } else if (fallback.length > 0) {
      debug(DEBUG_NS)(
        `Fallback back to [${fallback[0]}] to look [${term}] up.`
      );
      return this.lookupFullTermFallback(term, fallback[0], fallback.slice(1));
    } else {
      debug(DEBUG_NS)(`Vocab term lookup not found: [${term}].`);
      return undefined;
    }
  }
}

export { LitTermRegistry };
