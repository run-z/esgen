import { beforeEach, describe, expect, it } from '@jest/globals';
import { EsBundle } from './es-bundle.js';
import { EsScope, EsScopeKind } from './es-scope.js';
import { EsScopedValueKey } from './es-scoped-value-key.js';

describe('EsScope', () => {
  let bundle: EsBundle;
  let scope: EsScope;

  beforeEach(() => {
    bundle = new EsBundle();
    scope = bundle.nest();
  });

  describe('kind', () => {
    it('is Block by default', () => {
      expect(scope.kind).toBe(EsScopeKind.Block);
    });
    it('can be assigned', () => {
      expect(bundle.nest({ kind: EsScopeKind.Function }).kind).toBe(EsScopeKind.Function);
      expect(scope.nest({ kind: EsScopeKind.Function }).kind).toBe(EsScopeKind.Function);
    });
  });

  describe('bundle', () => {
    it('refers bundle', () => {
      expect(scope.bundle).toBe(bundle);
      expect(scope.nest().nest().bundle).toBe(bundle);
    });
  });

  describe('enclosing', () => {
    it('refers enclosing scope', () => {
      expect(scope.enclosing).toBe(bundle);
      expect(scope.nest().enclosing).toBe(scope);
    });
  });

  describe('functionOrBundle', () => {
    it('refers closest function or bundle', () => {
      expect(scope.functionOrBundle).toBe(bundle);
      expect(scope.nest().functionOrBundle).toBe(bundle);
      expect(scope.nest().nest().functionOrBundle).toBe(bundle);

      const fn = bundle.nest({ kind: EsScopeKind.Function });

      expect(fn.functionOrBundle).toBe(fn);
      expect(fn.nest().functionOrBundle).toBe(fn);
      expect(fn.nest().nest().functionOrBundle).toBe(fn);
    });
  });

  describe('ns', () => {
    it('is nested within bundle namespace', () => {
      const scope = bundle.nest({ ns: { comment: 'Nested' } });

      expect(scope.ns.toString()).toBe('/* Nested */');
      expect(bundle.ns.encloses(scope.ns)).toBe(true);
    });
    it('is nested within nested namespace', () => {
      const scope1 = bundle.nest();
      const scope2 = scope1.nest({ ns: { comment: 'Nested' } });

      expect(scope2.ns.toString()).toBe('/* Nested */');
      expect(bundle.ns.encloses(scope2.ns)).toBe(true);
      expect(scope1.ns.encloses(scope2.ns)).toBe(true);
    });
  });

  describe('isAsync', () => {
    it('is derived from enclosing scope for blocks', () => {
      expect(scope.isAsync()).toBe(true);
      expect(scope.nest({ async: false }).isAsync()).toBe(true);
    });
    it('is false by default for function scope', () => {
      expect(scope.nest({ kind: EsScopeKind.Function }).isAsync()).toBe(false);
    });
    it('can be assigned for to function scope', () => {
      expect(
        scope
          .nest({ kind: EsScopeKind.Function })
          .nest({ kind: EsScopeKind.Function, async: true })
          .isAsync(),
      ).toBe(true);
    });
  });

  describe('isGenerator', () => {
    it('is derived from enclosing scope for blocks', () => {
      expect(scope.isGenerator()).toBe(false);
      expect(scope.nest({ generator: true }).isGenerator()).toBe(false);
    });
    it('is false by default for function scope', () => {
      expect(scope.nest({ kind: EsScopeKind.Function }).isGenerator()).toBe(false);
    });
    it('can be assigned for to function scope', () => {
      expect(
        scope
          .nest({ kind: EsScopeKind.Function })
          .nest({ kind: EsScopeKind.Function, generator: true })
          .isGenerator(),
      ).toBe(true);
    });
  });

  describe('get', () => {
    let counter: number;
    let key: EsScopedValueKey<number>;

    beforeEach(() => {
      counter = 0;
      key = {
        esScopedValue(_scope) {
          return counter++;
        },
      };
    });

    it('constructs scoped value once', () => {
      expect(scope.get(key)).toBe(0);
      expect(scope.get(key)).toBe(0);
    });
    it('returns assigned value', () => {
      const scope = bundle.nest({
        setup: {
          esSetupScope(context) {
            context.set(key, 13);
          },
        },
      });

      expect(scope.get(key)).toBe(13);
    });
  });
});
