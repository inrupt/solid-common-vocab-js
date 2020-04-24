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
