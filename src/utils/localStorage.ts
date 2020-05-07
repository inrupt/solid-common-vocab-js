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

type Store = typeof window.localStorage;

/**
 * Returns a local store instance
 */
function buildStore(): Store {
  const storage = new Map<string, string>();
  return {
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    getItem: (key: string) => {
      const result = storage.get(key);
      return result ? result : null;
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    get length(): number {
      return storage.size;
    },
    clear: () => storage.clear(),
    key: function (index: number) {
      const iterator = storage.entries();
      let item = iterator.next();
      for (let i = 0; i < index; i++) {
        item = iterator.next();
      }
      return item && item.value ? item.value[0] : null;
    },
  };
}

/**
 * Returns localStore in a browser environment, and a local store instance otherwise
 */
function getLocalStore(): Store {
  if (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  ) {
    return window.localStorage;
  }
  return buildStore();
}

export { Store, getLocalStore, buildStore };
