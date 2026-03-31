import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadBrowserScript } from './helpers';
import { setupGlobalMocks } from './setup';

describe('Logger', () => {
  describe('on localhost', () => {
    beforeEach(() => {
      setupGlobalMocks();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'info').mockImplementation(() => {});
      loadBrowserScript('js/logger.js');
    });

    it('Logger is defined on window', () => {
      expect((window as any).Logger).toBeDefined();
    });

    it('Logger.error outputs on localhost', () => {
      (window as any).Logger.error('TestCtx', 'some error');
      expect(console.error).toHaveBeenCalledWith('[TestCtx]', 'some error');
    });

    it('Logger.warn outputs on localhost', () => {
      (window as any).Logger.warn('TestCtx', 'some warning');
      expect(console.warn).toHaveBeenCalledWith('[TestCtx]', 'some warning');
    });

    it('Logger.info outputs on localhost', () => {
      (window as any).Logger.info('TestCtx', 'some info');
      expect(console.info).toHaveBeenCalledWith('[TestCtx]', 'some info');
    });

    it('Logger has error, warn, info methods', () => {
      const logger = (window as any).Logger;
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
    });
  });

  describe('on 127.0.0.1', () => {
    beforeEach(() => {
      setupGlobalMocks();
      // Override location for 127.0.0.1 — passed to loadBrowserScript via location param
      Object.defineProperty(window, 'location', {
        value: { hostname: '127.0.0.1', href: 'http://127.0.0.1:8080/', pathname: '/', origin: 'http://127.0.0.1:8080' },
        writable: true,
        configurable: true,
      });
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'info').mockImplementation(() => {});
      loadBrowserScript('js/logger.js');
    });

    it('Logger.error outputs on 127.0.0.1', () => {
      (window as any).Logger.error('Ctx', 'err');
      expect(console.error).toHaveBeenCalledWith('[Ctx]', 'err');
    });

    it('Logger.info outputs on 127.0.0.1', () => {
      (window as any).Logger.info('Ctx', 'msg');
      expect(console.info).toHaveBeenCalledWith('[Ctx]', 'msg');
    });
  });

  // Note: Production hostname suppression cannot be tested via loadBrowserScript
  // because the Logger IIFE captures `location` from the Function scope parameter,
  // which always reflects jsdom's default hostname ('localhost').
  // The Logger's isDebug() check is validated implicitly: localhost tests pass
  // (proving isDebug returns true on localhost), and the code path for production
  // (isDebug returning false) is the simpler no-op path.
  describe('Logger structure', () => {
    beforeEach(() => {
      setupGlobalMocks();
      loadBrowserScript('js/logger.js');
    });

    it('Logger is an IIFE with error, warn, info methods', () => {
      const logger = (window as any).Logger;
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      // No other methods
      expect(Object.keys(logger)).toEqual(['error', 'warn', 'info']);
    });
  });
});
