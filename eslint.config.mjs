import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import vitest from "@vitest/eslint-plugin";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";
import { localRules } from "./scripts/eslint-local-rules.mjs";

const TEST_FILES = ["src/**/*.test.ts", "test/**/*.ts", "scripts/**/*.test.mjs"];

// Why: the legacy files were ported byte-for-byte from the JavaScript prototype to keep the 108 baselines identical (ADR 0010); they are cleaned up one folder at a time.
const LEGACY_FILES = ["none/**"];

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
    // Why: a resource class fills fields that its Base class already types, so an untyped literal there is not a lost union.
    files: ["src/Resources/**"],
    rules: { "local/known-keys": ["error", { inferred: false }] },
  },
  {
    // Why: in drawing code a number is a coordinate, size or angle of a shape, not a business rule; naming each one would hide the drawing behind constants. Logic code (Services, Modules, Commands) keeps the rule on.
    files: ["src/Resources/Assets/**", "src/Utils/PersonUtil.ts", "src/Utils/ShapeUtil.ts", "src/Services/BackgroundService.ts", "src/Services/LightingService.ts"],
    rules: { "@typescript-eslint/no-magic-numbers": "off" },
  },
  {
    // Why: legacy debt, recorded in ADR 0010. New code in these folders still has to pass the rules that are not switched off here.
    files: LEGACY_FILES,
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-magic-numbers": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-unnecessary-type-conversion": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
      "id-length": "off",
      "curly": "off",
      "no-nested-ternary": "off",
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/no-identical-functions": "off",
      "sonarjs/no-duplicated-branches": "off",
      "sonarjs/no-alphabetical-sort": "off",
      "sonarjs/super-linear-regex": "off",
      "max-depth": "off",
      "max-params": "off",
      "local/comment-marker": "off",
      "local/comment-placement": "off",
      "local/map-name": "off",
      "local/known-keys": "off",
      "local/literal-dispatch": "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@stylistic/max-statements-per-line": "off",
      "@stylistic/no-mixed-operators": "off",
      "no-useless-assignment": "off",
      "@typescript-eslint/no-misused-spread": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@stylistic/no-multiple-empty-lines": "off",
      "@stylistic/max-len": "off",
      "@stylistic/operator-linebreak": "off",
      "@stylistic/indent-binary-ops": "off",
      "@stylistic/quote-props": "off",
    },
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
