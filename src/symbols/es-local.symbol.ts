import { lazyValue } from '@proc7ts/primitives';
import { EsSnippet } from '../es-snippet.js';
import { EsNaming, EsNamingConstraints, EsSymbol, EsSymbolInit } from './es-symbol.js';

/**
 * Local symbol supposed to be {@link declare declared} prior to being used.
 */
export class EsLocalSymbol extends EsSymbol<EsLocalNaming, EsLocalNamingConstraints> {

  override bind(naming: EsNaming, constraints: EsLocalNamingConstraints): EsLocalNaming;
  override bind(naming: EsLocalNaming, { declare }: EsLocalNamingConstraints): EsLocalNaming {
    return {
      ...naming,
      asDeclaration: lazyValue(() => {
        const context: EsLocalContext = {
          symbol: this,
          naming: naming,
        };

        return 'declareLocal' in declare && typeof declare.declareLocal === 'function'
          ? declare.declareLocal(context)
          : (declare as EsLocalDeclarer.Function)(context);
      }),
    };
  }

  /**
   * @returns `false`, as the same local may be declared in multiple unrelated namespaces.
   */
  override isUnique(): boolean {
    return false;
  }

  /**
   * Declares local symbol and binds it to namespace.
   *
   * The local can be used after that.
   *
   * @param declare - Local symbol declarer.
   *
   * @returns Local's declaration statement.
   */
  declare(declare: EsLocalDeclarer): EsSnippet {
    return (code, scope) => {
      code.write(scope.ns.nameSymbol(this, { declare, requireNew: true }).asDeclaration());
    };
  }

  override toString({
    tag = '[Local]',
    comment,
  }: {
    /**
     * Symbol tag to include. Defaults to `[Local]`.
     */
    readonly tag?: string | null | undefined;
    /**
     * Comment to include. Defaults to {@link comment symbol comment}.
     */
    readonly comment?: string | null | undefined;
  } = {}): string {
    return super.toString({ tag, comment });
  }

}

/**
 * Creates local symbol.
 *
 * @param requestedName - Requested symbol name.
 * @param init - Symbol initialization options.
 *
 * @returns New local symbol instance.
 */
export function esLocal(requestedName: string, init?: EsSymbolInit): EsLocalSymbol {
  return new EsLocalSymbol(requestedName, init);
}

/**
 * Local symbol declarer.
 *
 * Generates code responsible for {@link EsLocalSymbol#declare declaration} of local.
 *
 * Either function of object.
 */
export type EsLocalDeclarer = EsLocalDeclarer.Function | EsLocalDeclarer.Object;

export namespace EsLocalDeclarer {
  /**
   * Signature of local symbol {@link EsLocalDeclarer declarer} function.
   *
   * @param context - Declaration context of local symbol.
   *
   * @returns Local's declaration statement.
   */
  export type Function = (this: void, context: EsLocalContext) => EsSnippet;

  /**
   * Local symbol {@link EsLocalDeclarer declarer} interface.
   */
  export interface Object {
    /**
     * Declares local symbol.
     *
     * @param context - Declaration context of local symbol.
     *
     * @returns Local's declaration statement.
     */
    declareLocal(context: EsLocalContext): EsSnippet;
  }
}

/**
 * Local symbol {@link EsLocalSymbol#declare declaration} context.
 *
 * Passed to {@link EsLocalDeclarer declarer} when declaring local symbol.
 */
export interface EsLocalContext {
  /**
   * Local symbol to declare.
   */
  readonly symbol: EsLocalSymbol;

  /**
   * Naming of local symbol within namespace.
   */
  readonly naming: EsNaming;
}

/**
 * Naming of {@link EsLocalSymbol local symbol} within namespace.
 */
export interface EsLocalNaming extends EsNaming {
  readonly symbol: EsLocalSymbol;

  /**
   * Emits local's {@link EsLocalSymbol#declare declaration} statement.
   */
  asDeclaration(this: void): EsSnippet;
}

/**
 * Naming constraints of {@link EsLocalSymbol local symbol}.
 */
export interface EsLocalNamingConstraints extends EsNamingConstraints {
  /**
   * Always require new name.
   */
  readonly requireNew: true;

  /**
   * Local symbol declarer.
   */
  readonly declare: EsLocalDeclarer;
}
