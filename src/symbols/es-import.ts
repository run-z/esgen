import { EsExternalModule } from './es-external-module.js';
import { EsImportInit, EsImportSymbol } from './es-import.symbol.js';

/**
 * Creates a symbol imported from the named {@link EsExternalModule external module}.
 *
 * @param from - Source module name.
 * @param name - Name of symbol to import.
 * @param init - Import initialization options.
 *
 * @returns Imported symbol instance.
 */
export function esImport(from: string, name: string, init?: EsImportInit): EsImportSymbol {
  return EsExternalModule.byName(from).import(name, init);
}
