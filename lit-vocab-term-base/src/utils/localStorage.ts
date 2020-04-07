interface IStore {
  setItem(key: string, value: string): void;
  getItem(key: string): string | undefined;
}

// Storage Mock
function mockStorage(): IStore {
  let storage = new Map<string, string>();
  return {
    setItem: function (key: string, value: string) {
      storage.set(key, value);
    },
    getItem: function (key: string) {
      return storage.get(key);
    },
  };
}

export { IStore, mockStorage };
