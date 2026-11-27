// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

/*
 * Architecture rules — template from the Forge angular pack
 * (forge/packs/angular/rules/architecture.md § 2 "one door per technology" and § 3 "import boundaries").
 * Copy to eslint.config.mjs at the workspace root and adapt the places marked ADAPT.
 * Needs: eslint, @eslint/js, typescript-eslint, angular-eslint.
 *
 * How this file is built: every rule below is a named "restriction" (import patterns + the message
 * that states the fix). Each ZONE of the workspace then lists the restrictions that apply to it.
 * Why not one config block per rule: in flat config a later block REPLACES the options of
 * `no-restricted-imports` instead of merging them, so each zone must carry its complete list.
 * Zones are therefore disjoint: a file belongs to exactly one (where two blocks match the same file,
 * the LATER one wins entirely — that is how the pwa-data zone overrides domain-data).
 *
 * Known limits (checked in review): dynamic import() is not seen by no-restricted-imports; raw native
 * controls beside an existing wrapper; style literals; cross-domain cycles (add a cycle checker with
 * the second shared domain).
 *
 * Patterns are regular expressions tested against the import specifier as written.
 */

// --- One door per technology -------------------------------------------------------------------

/**
 * ADAPT: the component framework of the project. While none is chosen (ui-wrapper wraps native
 * elements) the usual candidates stay listed so the door is already closed.
 */
const COMPONENT_FRAMEWORK = {
  regex:
    '^(@angular/material|@angular/cdk|primeng|primeicons|ng-zorro-antd|@ng-bootstrap/ng-bootstrap|@ionic/angular|@taiga-ui/[^/]+|@spartan-ng/[^/]+|@ng-select/ng-select)($|/)',
  message:
    'The component framework is imported only by libs/ui-wrapper. Use or add a wrapper in @app/ui-wrapper.',
};

const STATE_LIBRARY = {
  regex: '^@ngrx/',
  message:
    'Only stores (<domain>/store/) and shared-state/core use the state library: expose a Signal through the facade.',
};

const HTTP_AND_RXJS = {
  regex: '^(rxjs|@angular/common/http|@angular/core/rxjs-interop)($|/)',
  message:
    "Data access lives in the domain's data/ folder: return a Promise of a model, and keep the HTTP client and RxJS there.",
};

/** App-level HTTP setup (interceptors, guards, provideHttpClient) is the one exception to the HTTP door. */
const APP_INFRA = ['src/app/core/**/*.ts', 'src/app/app.config.ts'];

/**
 * shared-state/core has two entry points: `@app/shared-state/core` (contracts: error model, latest-wins,
 * persistence contract — importable anywhere a domain layer may use core) and
 * `@app/shared-state/core/store` (store features bound to the state library — stores only).
 */
const STORE_FEATURES = {
  regex: '^@app/shared-state/core/store$',
  message:
    'Store features are bound to the state library: only <domain>/store/ may import @app/shared-state/core/store. Everything else uses the contracts in @app/shared-state/core.',
};

const SERVICE_WORKER = {
  regex: '^@angular/service-worker($|/)',
  message:
    "Only the pwa domain's data/ folder (and app.config.ts, to register it) touches the service worker: use a PWA facade.",
};

const UI_WRAPPER = {
  regex: '^@app/ui-wrapper($|/)',
  message:
    'State and data layers know nothing about the UI: wrappers are used by components only.',
};

const APP_SOURCES = {
  regex: '(^|/)src/|^@app/shared-state/',
  message:
    'A wrapper depends on nothing in the application or its state: take values through input() and emit output().',
};

// --- Components and containers -----------------------------------------------------------------

const STORE_OR_REPOSITORY_FILE = {
  regex: '\\.(store|repository)$',
  message:
    'A component does not inject a store or a repository: inject the domain facade (the abstract class exported by the domain entry point).',
};

// --- Domain entry points -----------------------------------------------------------------------

const DEEP_IMPORT_INTO_LIB = {
  regex:
    '^@app/(?!shared-state/core/store$)(shared-state/[^/]+|ui-wrapper|styles)/.+|(^|/)libs/(shared-state|ui-wrapper|styles)(/|$)',
  message:
    'Import the domain through its entry point: @app/shared-state/<domain> (or @app/ui-wrapper), never a file inside it nor a relative path into libs/.',
};

const DEEP_IMPORT_INTO_FEATURE_DOMAIN = {
  regex: '(^|/)state/[^/]+/.+',
  message:
    'Import the domain through its entry point: ./state/<domain> (its index.ts), never a file inside it.',
};

/** Sub-folders are one level deep, so `../../` from one of them leaves the domain. */
const RELATIVE_PATH_OUT_OF_DOMAIN_FOLDER = {
  regex: '^\\.\\./\\.\\./',
  message:
    'A relative import must stay inside the domain: reach shared-state/core and other domains through their @app/shared-state/<name> entry point.',
};
const RELATIVE_PATH_OUT_OF_DOMAIN_ROOT = {
  ...RELATIVE_PATH_OUT_OF_DOMAIN_FOLDER,
  regex: '^\\.\\./',
};

const OTHER_DOMAIN = {
  regex: '^@app/shared-state/(?!core$|core/store$)',
  message:
    "Only a facade implementation may depend on another domain, and only on its facade contract: move the coordination to <domain>/facade/ and import the other domain's entry point there.",
};

// --- Boundaries inside a domain (facade → store, data, model ; store → model, core ; data → model, core ; model → nothing)

/** @param {string[]} folders @param {string} message */
const domainFolders = (folders, message) => ({
  regex: `(^|/)(${folders.join('|')})/`,
  message,
});

const FACADE_BOUNDARY = domainFolders(
  ['testing'],
  'facade/ may import store/, data/, model/ and shared-state/core only. The mock facade (testing/) is wired by <domain>.providers.ts.',
);
const STORE_BOUNDARY = domainFolders(
  ['facade', 'data', 'testing'],
  'store/ may import model/ and shared-state/core only: the facade implementation calls the repository and hands the result to the store.',
);
const DATA_BOUNDARY = domainFolders(
  ['facade', 'store', 'testing'],
  'data/ may import model/ and shared-state/core (error model) only: return models, and let the facade implementation update the store.',
);
const MODEL_BOUNDARY = {
  regex: '(^|/)(facade|store|data|testing)/|^@angular/|^@app/',
  message:
    'model/ holds pure types and pure functions: it imports nothing from the domain, from Angular or from another library. Move the dependent code to facade/, store/ or data/.',
};
const TESTING_BOUNDARY = domainFolders(
  ['store', 'data'],
  'testing/ holds the mock facade: it implements the facade contract with plain signals and imports facade/, model/ and the core contracts only.',
);
const CORE_BOUNDARY = {
  regex: '^\\.\\./\\.\\./|^@app/(?!shared-state/core$)',
  message:
    'shared-state/core holds project contracts and shared store features: it depends on no domain and no other library. Domains import core, never the reverse.',
};

/**
 * @param {string} name
 * @param {string[]} files
 * @param {{regex: string, message: string}[]} restrictions
 * @param {string[]} [ignores]
 */
const zone = (name, files, restrictions, ignores = []) => ({
  name: `architecture/${name}`,
  files,
  ignores,
  rules: {
    'no-restricted-imports': ['error', { patterns: restrictions }],
  },
});

/** A domain lives in libs/shared-state/<domain>/ or in src/app/<feature>/state/<domain>/ — same template, same rules. */
const DOMAIN_ROOTS = ['libs/shared-state/*', 'src/app/**/state/*'];
/** @param {string} sub */
const inDomains = (sub) => DOMAIN_ROOTS.map((root) => `${root}/${sub}`);
const CORE = 'libs/shared-state/core/**/*.ts';
const CORE_STORE = 'libs/shared-state/core/store/**/*.ts';

const architectureZones = [
  // Features, shell, app config: everything goes through wrappers and facade contracts.
  zone(
    'app',
    ['src/**/*.ts'],
    [
      COMPONENT_FRAMEWORK,
      SERVICE_WORKER,
      STATE_LIBRARY,
      HTTP_AND_RXJS,
      STORE_FEATURES,
      STORE_OR_REPOSITORY_FILE,
      DEEP_IMPORT_INTO_LIB,
      DEEP_IMPORT_INTO_FEATURE_DOMAIN,
    ],
    ['src/app/**/state/*/**', ...APP_INFRA],
  ),
  // App-level infrastructure: may configure HTTP, still no state library and no domain internals.
  zone('app-infra', APP_INFRA, [
    COMPONENT_FRAMEWORK,
    STATE_LIBRARY,
    STORE_FEATURES,
    STORE_OR_REPOSITORY_FILE,
    DEEP_IMPORT_INTO_LIB,
    DEEP_IMPORT_INTO_FEATURE_DOMAIN,
  ]),
  // The only importer of the component framework.
  zone(
    'ui-wrapper',
    ['libs/ui-wrapper/**/*.ts'],
    [STATE_LIBRARY, HTTP_AND_RXJS, SERVICE_WORKER, APP_SOURCES, STORE_OR_REPOSITORY_FILE],
  ),
  // Contracts: no state library, so every layer can depend on them.
  zone(
    'shared-state-core',
    [CORE],
    [COMPONENT_FRAMEWORK,
      SERVICE_WORKER, STATE_LIBRARY, HTTP_AND_RXJS, UI_WRAPPER, CORE_BOUNDARY],
    [CORE_STORE],
  ),
  // Store features: the only part of core that may use the state library.
  zone('shared-state-core-store', [CORE_STORE], [
    COMPONENT_FRAMEWORK,
      SERVICE_WORKER,
    HTTP_AND_RXJS,
    UI_WRAPPER,
    CORE_BOUNDARY,
  ]),
  zone(
    'domain-facade',
    inDomains('facade/**/*.ts'),
    [
      COMPONENT_FRAMEWORK,
      SERVICE_WORKER,
      UI_WRAPPER,
      STORE_FEATURES,
      STATE_LIBRARY,
      HTTP_AND_RXJS,
      FACADE_BOUNDARY,
      DEEP_IMPORT_INTO_LIB,
      RELATIVE_PATH_OUT_OF_DOMAIN_FOLDER,
    ],
    [CORE],
  ),
  zone(
    'domain-store',
    inDomains('store/**/*.ts'),
    [
      COMPONENT_FRAMEWORK,
      SERVICE_WORKER,
      UI_WRAPPER,
      HTTP_AND_RXJS,
      STORE_BOUNDARY,
      OTHER_DOMAIN,
      DEEP_IMPORT_INTO_LIB,
      RELATIVE_PATH_OUT_OF_DOMAIN_FOLDER,
    ],
    [CORE],
  ),
  zone(
    'domain-data',
    inDomains('data/**/*.ts'),
    [
      COMPONENT_FRAMEWORK,
      SERVICE_WORKER,
      UI_WRAPPER,
      STORE_FEATURES,
      STATE_LIBRARY,
      DATA_BOUNDARY,
      OTHER_DOMAIN,
      DEEP_IMPORT_INTO_LIB,
      RELATIVE_PATH_OUT_OF_DOMAIN_FOLDER,
    ],
    [CORE],
  ),
  zone(
    'domain-model',
    inDomains('model/**/*.ts'),
    [
      COMPONENT_FRAMEWORK,
      SERVICE_WORKER,
      UI_WRAPPER,
      STORE_FEATURES,
      STATE_LIBRARY,
      HTTP_AND_RXJS,
      MODEL_BOUNDARY,
      RELATIVE_PATH_OUT_OF_DOMAIN_FOLDER,
    ],
    [CORE],
  ),
  zone(
    'domain-testing',
    inDomains('testing/**/*.ts'),
    [
      COMPONENT_FRAMEWORK,
      SERVICE_WORKER,
      UI_WRAPPER,
      STORE_FEATURES,
      STATE_LIBRARY,
      HTTP_AND_RXJS,
      TESTING_BOUNDARY,
      OTHER_DOMAIN,
      DEEP_IMPORT_INTO_LIB,
      RELATIVE_PATH_OUT_OF_DOMAIN_FOLDER,
    ],
    [CORE],
  ),
  // The pwa domain's data/ folder is the service worker's only door (same list as domain-data, minus that one).
  zone('pwa-data', ['libs/shared-state/pwa/data/**/*.ts'], [
    COMPONENT_FRAMEWORK,
    UI_WRAPPER,
    STORE_FEATURES,
    STATE_LIBRARY,
    DATA_BOUNDARY,
    OTHER_DOMAIN,
    DEEP_IMPORT_INTO_LIB,
    RELATIVE_PATH_OUT_OF_DOMAIN_FOLDER,
  ]),
  // <domain>.providers.ts and index.ts wire the domain: they may reach every folder of their own domain.
  zone(
    'domain-root',
    inDomains('*.ts'),
    [
      COMPONENT_FRAMEWORK,
      SERVICE_WORKER,
      UI_WRAPPER,
      STORE_FEATURES,
      STATE_LIBRARY,
      HTTP_AND_RXJS,
      OTHER_DOMAIN,
      DEEP_IMPORT_INTO_LIB,
      RELATIVE_PATH_OUT_OF_DOMAIN_ROOT,
    ],
    [CORE],
  ),
  // A file placed directly under libs/shared-state/ belongs to no domain: it gets the strictest list.
  zone('shared-state-stray', ['libs/shared-state/*.ts'], [
    COMPONENT_FRAMEWORK,
    SERVICE_WORKER,
    STATE_LIBRARY,
    HTTP_AND_RXJS,
    UI_WRAPPER,
    STORE_FEATURES,
  ]),
];

/**
 * Doors that are browser globals, not imports. `no-restricted-globals` is a separate rule, so these
 * blocks do not disturb the import zones above. (They do not see `window.localStorage` — review does.)
 */
const STORAGE_GLOBALS = ['localStorage', 'sessionStorage', 'indexedDB', 'caches'].map((name) => ({
  name,
  message:
    'Browser storage is reached only through the StatePersistence adapter in libs/shared-state/core.',
}));
const FETCH_GLOBAL = {
  name: 'fetch',
  message: "Network access lives in a domain's data/ folder: call the repository through the facade.",
};
const globalDoors = [
  {
    name: 'architecture/globals',
    files: ['src/**/*.ts', 'libs/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: { 'no-restricted-globals': ['error', ...STORAGE_GLOBALS, FETCH_GLOBAL] },
  },
  {
    name: 'architecture/globals-data',
    files: [...inDomains('data/**/*.ts')],
    ignores: ['**/*.spec.ts'],
    rules: { 'no-restricted-globals': ['error', ...STORAGE_GLOBALS] },
  },
  {
    name: 'architecture/globals-core',
    files: [CORE],
    ignores: ['**/*.spec.ts'],
    rules: { 'no-restricted-globals': ['error', FETCH_GLOBAL] },
  },
];

export default defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // ADAPT: selector prefixes — `app-` for the application, `ui-` for the wrappers of libs/ui-wrapper.
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: ['app', 'ui'], style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: ['app', 'ui'], style: 'kebab-case' },
      ],
    },
  },
  ...architectureZones,
  ...globalDoors,
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
