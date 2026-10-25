import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import vitest from "@vitest/eslint-plugin";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";
import { localRules } from "./scripts/eslint-local-rules.mjs";

const SCENE_FLAG_KEYS = "^(shadow|trim|glasses|beard|cane|handle|steam|mic|stand|off)$";

const TEST_FILES = ["src/**/*.test.ts", "test/**/*.ts", "scripts/**/*.test.mjs"];

// Why: layer order is Errors, Protocols < Utils < Resources < Services < Modules < Cli; Adapters only see Protocols and Utils, so the core never reaches the native renderer or the file system.
const LAYER_TO_FORBIDDEN_LAYERS = {
  Errors: ["Protocols", "Utils", "Resources", "Services", "Modules", "Adapters"],
  Protocols: ["Utils", "Resources", "Services", "Modules", "Adapters"],
  Utils: ["Resources", "Services", "Modules", "Adapters"],
  Resources: ["Services", "Modules", "Adapters"],
  Services: ["Modules", "Adapters"],
  Adapters: ["Resources", "Services", "Modules"],
};

const layerConfigs = Object.entries(LAYER_TO_FORBIDDEN_LAYERS).map(([layer, forbiddenLayers]) => ({
  files: [`src/${layer}/**/*.ts`],
  ignores: TEST_FILES,
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: forbiddenLayers.map((forbidden) => `**/${forbidden}/**`),
        message: `${layer} must not import ${forbiddenLayers.join(", ")}: layers only import the ones below them.`,
      }],
    }],
  },
}));

const coreModulesConfig = {
  // Why: the compile core stays pure, so only the critic and the check (which need the native renderer) may import Adapters.
  files: ["src/Modules/**/*.ts"],
  ignores: [...TEST_FILES, "src/Modules/CritiqueModule.ts", "src/Modules/CheckModule.ts"],
  rules: {
    "no-restricted-imports": ["error", { patterns: [
      { group: ["**/Adapters/**"], message: "Core modules are pure: only the critic and the check use Adapters." },
      { group: ["node:*", "fs", "path"], message: "The core has no file system; use the FileReader option." },
    ] }],
  },
};

const MAX_COGNITIVE_COMPLEXITY = 15;
const MAX_DEPTH = 3;
const MAX_PARAMS = 5;
const BOOLEAN_PREFIXES = ["is", "has", "should", "can", "must", "was", "did"];

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "coverage/", "test/visual/report/", "test/visual/cases/", "skills/**/scripts/"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  stylistic.configs.customize({ indent: 2, quotes: "double", semi: true, braceStyle: "1tbs", commaDangle: "always-multiline", arrowParens: true }),
  {
    plugins: { sonarjs, local: localRules },
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "id-length": ["error", { min: 2, exceptionPatterns: ["^_$"], properties: "never" }],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "import", format: ["camelCase", "PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "variable", modifiers: ["const", "global"], format: ["UPPER_CASE", "camelCase"] },
        { selector: "variable", modifiers: ["const", "global"], types: ["boolean", "number", "string", "array"], format: ["UPPER_CASE"] },
        { selector: ["variable", "parameter"], types: ["boolean"], format: ["PascalCase"], prefix: BOOLEAN_PREFIXES },
        // Why: these flags are fields that scene authors write in YAML (`glasses: true`), so their spelling is fixed.
        { selector: "typeProperty", types: ["boolean"], format: null, filter: { regex: SCENE_FLAG_KEYS, match: true } },
        { selector: ["typeProperty", "classProperty", "parameterProperty", "accessor"], types: ["boolean"], format: ["PascalCase"], prefix: BOOLEAN_PREFIXES },
        { selector: "classProperty", modifiers: ["static", "readonly"], format: ["UPPER_CASE", "camelCase"] },
        // Why: keys of external formats (YAML fields, SVG attributes, CLI flags) keep their spelling.
        { selector: ["objectLiteralProperty", "objectLiteralMethod", "typeProperty"], modifiers: ["requiresQuotes"], format: null },
        { selector: ["objectLiteralProperty", "objectLiteralMethod", "typeProperty"], format: null, filter: { regex: "^[a-z]+(_[a-z]+)+$", match: true } },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/switch-exhaustiveness-check": ["error", { requireDefaultForNonUnion: true, considerDefaultExhaustiveForUnions: true }],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-floating-promises": "error",
      // Why: it asks for `value!` where `no-non-null-assertion` forbids it; code narrows with a guard instead.
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
      "@stylistic/member-delimiter-style": "error",
      "curly": ["error", "all"],
      "no-nested-ternary": "error",
      "no-console": "error",
      "@typescript-eslint/no-magic-numbers": ["error", {
        ignore: [-1, 0, 0.5, 1, 2, 100], ignoreArrayIndexes: true, ignoreDefaultValues: true, ignoreEnums: true,
        ignoreNumericLiteralTypes: true, ignoreReadonlyClassProperties: true, ignoreTypeIndexes: true,
      }],
      "sonarjs/cognitive-complexity": ["error", MAX_COGNITIVE_COMPLEXITY],
      "max-depth": ["error", MAX_DEPTH],
      "max-params": ["error", MAX_PARAMS],
      "sonarjs/no-nested-conditional": "error",
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-duplicated-branches": "error",
      "sonarjs/no-identical-conditions": "error",
      "sonarjs/no-duplicate-string": "error",
      "sonarjs/super-linear-regex": "error",
      "sonarjs/no-alphabetical-sort": "error",
      "local/comment-marker": "error",
      "local/comment-placement": "error",
      "local/map-name": "error",
      "local/known-keys": ["error", { inferred: true }],
      "local/literal-dispatch": "error",
      "max-classes-per-file": ["error", 1],
      "local/class-matches-file": "error",
      "@typescript-eslint/no-extraneous-class": ["error", { allowStaticOnly: true }],
      "no-restricted-syntax": ["error", {
        selector: "CallExpression > CallExpression.arguments:matches([arguments.length>=3], :has(> CallExpression.arguments))",
        message: "Store this call's result in a named variable before passing it to another call.",
      }],
      // Why: the compile core must be pure (ADR 0004): same scene, same SVG, on any machine.
      "no-restricted-globals": ["error", { name: "Date", message: "The core is pure: no clock." }],
      "@stylistic/max-len": ["error", { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreRegExpLiterals: true, ignoreComments: true }],
    },
  },
  ...layerConfigs,
  coreModulesConfig,
  {
    // Why: the core never touches the clock, randomness, the file system or the process; only render and cli do.
    files: ["src/Errors/**", "src/Protocols/**", "src/Utils/**", "src/Resources/**", "src/Services/**", "src/Modules/**"],
    ignores: [...TEST_FILES, "src/Modules/CritiqueModule.ts", "src/Modules/CheckModule.ts"],
    rules: {
      "no-restricted-properties": ["error",
        { object: "Math", property: "random", message: "The core is pure: no randomness." },
        { object: "process", property: "env", message: "Only render and cli read the environment." },
      ],
      "no-restricted-imports": ["error", { patterns: [{ group: ["node:*", "fs", "path"], message: "The core has no file system; use the FileReader option." }] }],
    },
  },
  {
    files: ["src/**/*.test.ts"],
    rules: { "local/describe-target": "error" },
  },
  {
    files: ["src/cli.ts", "src/Commands/**", "scripts/**", "test/**"],
    rules: { "no-console": "off", "@typescript-eslint/no-magic-numbers": "off" },
  },
  {
    // Why: the config and the build scripts are plain JavaScript with no types to narrow.
    files: ["eslint.config.mjs", "scripts/**"],
    rules: { "local/known-keys": "off" },
  },
  {
    // Why: the Oklab conversion is a published table of coefficients; each number has no meaning apart from its place in the matrix.
    files: ["src/Utils/OklabUtil.ts"],
    rules: { "@typescript-eslint/no-magic-numbers": "off" },
  },
  {
    // Why: a resource class fills fields that its Base class already types, so an untyped literal there is not a lost union.
    files: ["src/Resources/**"],
    rules: { "local/known-keys": ["error", { inferred: false }] },
  },
  {
    // Why: in drawing code a number is a coordinate, size or angle of a shape, not a business rule; naming each one would hide the drawing behind constants. Logic code (Services, Modules, Commands) keeps the rule on.
    files: ["src/Resources/Assets/**", "src/Utils/Person*Util.ts", "src/Utils/ShapeUtil.ts", "src/Utils/RecolorUtil.ts", "src/Utils/ColorUtil.ts", "src/Services/BackgroundService.ts", "src/Services/LightingService.ts",
      "src/Services/Map*Service.ts", "src/Services/Plane*Service.ts", "src/Utils/TransportUtil.ts", "src/Utils/CurveUtil.ts"],
    rules: { "@typescript-eslint/no-magic-numbers": "off" },
  },
  {
    files: TEST_FILES,
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/naming-convention": "off",
      "sonarjs/no-duplicate-string": "off",
      "no-restricted-properties": "off",
      "no-restricted-syntax": "off",
      "sonarjs/no-alphabetical-sort": "off",
    },
  },
  {
    files: TEST_FILES,
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/no-conditional-expect": "error",
      "vitest/no-conditional-in-test": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
      "vitest/prefer-strict-equal": "error",
      "vitest/prefer-to-be": "error",
      "vitest/prefer-to-have-length": "error",
      "vitest/no-restricted-matchers": ["error", {
        toBeDefined: "Assert the value itself (toBe, toStrictEqual, toMatchObject).",
        toBeTruthy: "Assert the exact value: toBe(true) or the expected value.",
        toBeFalsy: "Assert the exact value: toBe(false), toBeUndefined() or the expected value.",
      }],
    },
  },
  { files: ["**/*.mjs", "**/*.js"], ...tseslint.configs.disableTypeChecked },
);
