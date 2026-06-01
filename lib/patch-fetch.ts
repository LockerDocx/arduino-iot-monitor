// Patch to configure window.fetch to be writable and configurable.
// This prevents TypeError when third-party libraries (e.g. MediaPipe/WASM wrappers)
// attempt to monkey-patch or redefine window.fetch on the Window object.

if (typeof window !== 'undefined' && 'fetch' in window) {
  try {
    const originalFetch = window.fetch;
    // Redefine fetch on the Direct Window Instance so that it is writable
    Object.defineProperty(window, 'fetch', {
      value: originalFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
    console.log("[PATCH] Successfully made window.fetch writable and configurable.");
  } catch (error) {
    console.warn("[PATCH] Failed to modify window.fetch descriptor:", error);
  }
}

export {};
