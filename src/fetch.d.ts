/**
 * https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924
 * fetch api is present in node 18+ and based on undici, but @types/node
 * doesn't have typings for it yet.
 */
declare const fetch: typeof import('undici').fetch;
