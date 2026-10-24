import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import tseslint from "typescript-eslint";

const COMMENT_MARKER = /^Why: \S/;
const TOOL_DIRECTIVE = /^(eslint-disable|eslint-enable|@ts-expect-error|global )/;
const EQUALITY_OPERATORS = new Set(["===", "==", "!==", "!="]);
const MIN_CASES_FOR_MAP = 2;
const PASSTHROUGH_TYPES = new Set(["LogicalExpression", "UnaryExpression"]);
const EXIT_TYPES = new Set(["ReturnStatement", "ThrowStatement", "ContinueStatement", "BreakStatement"]);

const COMMENT_TYPE_TO_TRAITS = {
  Line: { isLineComment: true, isDirective: false },
  Block: { isLineComment: false, isDirective: false },
  Shebang: { isLineComment: false, isDirective: true },
};

function firstLineOf(comment) {
  return comment.value.split("\n").map((line) => line.replace(/^\s*\*?\s?/, "").trim()).find(Boolean) ?? "";
}

const commentMarker = {
  meta: {
    type: "suggestion",
    messages: { missing: "Delete this comment, or start it with \"Why:\" and the hidden rule it protects." },
  },
  create(context) {
    return {
      "Program:exit"() {
        let previousLineCommentEnd = -1;
        for (const comment of context.sourceCode.getAllComments()) {
          const { isLineComment, isDirective } = COMMENT_TYPE_TO_TRAITS[comment.type];
          // Why: consecutive line comments are one comment; only the first line carries the marker.
          const isContinuation = isLineComment && comment.loc.start.line === previousLineCommentEnd + 1;
          previousLineCommentEnd = isLineComment ? comment.loc.end.line : -1;
          const firstLine = firstLineOf(comment);
          const isAllowed = isDirective || COMMENT_MARKER.test(firstLine) || TOOL_DIRECTIVE.test(firstLine);
          if (!isContinuation && !isAllowed) {
            context.report({ loc: comment.loc, messageId: "missing" });
          }
        }
      },
    };
  },
};

const PROTOCOL_FOLDER = /[\\/]Protocols[\\/]/;
const EXPORT_TYPES = new Set(["ExportNamedDeclaration", "ExportDefaultDeclaration"]);
const DECLARATION_SELECTOR = [
  "FunctionDeclaration",
  "ClassDeclaration",
  "MethodDefinition",
  "TSAbstractMethodDefinition",
  "TSDeclareFunction",
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
  "TSPropertySignature",
  "PropertyDefinition[value.type=/FunctionExpression$/]",
  "VariableDeclaration:has(> VariableDeclarator[init.type=/FunctionExpression$/])",
].join(", ");

function isToolComment(comment) {
  const { isDirective } = COMMENT_TYPE_TO_TRAITS[comment.type];
  return isDirective || TOOL_DIRECTIVE.test(firstLineOf(comment));
}

function declarationAnchor(node) {
  return EXPORT_TYPES.has(node.parent?.type) ? node.parent : node;
}

const commentPlacement = {
  meta: {
    type: "suggestion",
    messages: {
      header: "Delete this file header: a comment sits next to the line whose hidden rule it explains.",
      protocol: "Delete this comment: a type doesn't apply rules. Put the rule next to the code that applies it, and units or meaning in the name.",
      declaration: "Move this comment next to the line inside where its rule happens, or delete it if the name and code already say it.",
    },
  },
  create(context) {
    const { sourceCode } = context;
    const isProtocol = PROTOCOL_FOLDER.test(context.filename);
    const firstCodeAt = sourceCode.ast.body[0]?.range[0] ?? Number.POSITIVE_INFINITY;
    const report = (comments, messageId) => {
      let previousEndLine = -1;
      for (const comment of comments.filter((candidate) => !isToolComment(candidate))) {
        const isContinuation = comment.loc.start.line === previousEndLine + 1;
        previousEndLine = comment.loc.end.line;
        if (!isContinuation) {
          context.report({ loc: comment.loc, messageId });
        }
      }
    };
    const reportDeclaration = (node) => {
      if (isProtocol) {
        return;
      }
      const leading = sourceCode.getCommentsBefore(declarationAnchor(node));
      report(leading.filter((comment) => comment.range[0] >= firstCodeAt), "declaration");
    };
    return {
      "Program"() {
        const comments = sourceCode.getAllComments();
        if (isProtocol) {
          report(comments, "protocol");
          return;
        }
        report(comments.filter((comment) => comment.range[1] <= firstCodeAt), "header");
      },
      [DECLARATION_SELECTOR]: reportDeclaration,
    };
  },
};

const NODE_TYPE_TO_IS_FIXED = new Map([
  ["Literal", (node) => typeof node.value === "string" && node.value !== ""],
  ["TemplateLiteral", (node) => node.expressions.length === 0 && node.quasis[0]?.value.cooked !== ""],
]);

function isFixedValue(node) {
  return NODE_TYPE_TO_IS_FIXED.get(node.type)?.(node) ?? false;
}

function isTypeCheck(subject) {
  return subject.type === "UnaryExpression" && subject.operator === "typeof";
}

function comparedSubject(comparison) {
  if (!EQUALITY_OPERATORS.has(comparison.operator)) {
    return undefined;
  }
  const isRightFixed = isFixedValue(comparison.right);
  if (isRightFixed === isFixedValue(comparison.left)) {
    return undefined;
  }
  const subject = isRightFixed ? comparison.left : comparison.right;
  return isTypeCheck(subject) ? undefined : subject;
}

function lastStatementOf(statement) {
  return Array.isArray(statement.body) ? statement.body.at(-1) : statement;
}

function isGuard(ifStatement) {
  const lastStatement = lastStatementOf(ifStatement.consequent);
  return !ifStatement.alternate && lastStatement !== undefined && EXIT_TYPES.has(lastStatement.type);
}

const DECISION_TYPE_TO_IS_BRANCH = new Map([
  ["IfStatement", (ifStatement) => !isGuard(ifStatement)],
  ["ConditionalExpression", () => true],
]);

function isBranchCondition(comparison) {
  let condition = comparison;
  while (PASSTHROUGH_TYPES.has(condition.parent?.type)) {
    condition = condition.parent;
  }
  const decision = condition.parent;
  const isBranch = DECISION_TYPE_TO_IS_BRANCH.get(decision?.type);
  return decision?.test === condition && isBranch !== undefined && isBranch(decision);
}

const literalDispatch = {
  meta: {
    type: "suggestion",
    messages: {
      repeated: "\"{{subject}}\" is compared with a fixed value again in this function. Dispatch through a Record<Key, Handler> map instead.",
      branch: "This branch picks code by comparing \"{{subject}}\" with a fixed value. Dispatch through a Record<Key, Handler> map, or make it a guard that leaves early.",
      switchCases: "This switch dispatches on fixed values. Use a Record<Key, Handler> map instead.",
    },
  },
  create(context) {
    const scopes = [new Map()];
    const record = (comparison) => {
      const subject = comparedSubject(comparison);
      if (!subject) {
        return;
      }
      const key = context.sourceCode.getText(subject).replaceAll("?.", ".");
      const seen = scopes.at(-1);
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      if (count >= MIN_CASES_FOR_MAP) {
        context.report({ node: comparison, messageId: "repeated", data: { subject: key } });
        return;
      }
      if (isBranchCondition(comparison)) {
        context.report({ node: comparison, messageId: "branch", data: { subject: key } });
      }
    };
    return {
      ":function"() {
        scopes.push(new Map());
      },
      ":function:exit"() {
        scopes.pop();
      },
      "BinaryExpression"(node) {
        record(node);
      },
      "SwitchStatement"(node) {
        const fixedCases = node.cases.filter((switchCase) => switchCase.test && isFixedValue(switchCase.test));
        if (fixedCases.length >= MIN_CASES_FOR_MAP) {
          context.report({ node, messageId: "switchCases" });
        }
      },
    };
  },
};

function fileStemOf(filename) {
  const base = filename.split(/[\\/]/).at(-1) ?? "";
  return base.replace(/\.[^.]+$/, "");
}

const classMatchesFile = {
  meta: {
    type: "suggestion",
    messages: { mismatch: "Class \"{{name}}\" lives in \"{{file}}\"; name the file after its one class." },
  },
  create(context) {
    const stem = fileStemOf(context.filename);
    return {
      "Program > ClassDeclaration, Program > ExportNamedDeclaration > ClassDeclaration"(node) {
        const name = node.id?.name;
        if (name && name !== stem) {
          context.report({ node: node.id, messageId: "mismatch", data: { name, file: stem } });
        }
      },
    };
  },
};

const DESCRIBE_TARGET = /^([A-Z]\w*)\.(\w+)\(\)$/;
const HIDDEN_ACCESSIBILITY = new Set(["private", "protected"]);
const TEST_SUFFIX = /\.test$/;
const SOURCE_EXTENSION = ".ts";

function isPublicMember(member) {
  const isNamed = member.key?.type === "Identifier";
  return isNamed && !HIDDEN_ACCESSIBILITY.has(member.accessibility) && member.kind !== "constructor";
}

function publicMethodsOf(sourcePath, className) {
  const { ast: program } = tseslint.parser.parseForESLint(readFileSync(sourcePath, "utf8"), { sourceType: "module" });
  const declarations = program.body.map((node) => node.declaration ?? node);
  const classNode = declarations.find((node) => node.type === "ClassDeclaration" && node.id?.name === className);
  const members = classNode?.body.body ?? [];
  return new Set(members.filter((member) => isPublicMember(member)).map((member) => member.key.name));
}

function calleeNameOf(statement) {
  return statement.expression?.callee?.name;
}

const describeTarget = {
  meta: {
    type: "suggestion",
    messages: {
      format: "Name the outer describe \"{{className}}.<method>()\": the class this file tests and the public method the tests go through.",
      otherClass: "This file tests {{className}}; the outer describe names \"{{named}}\".",
      notPublic: "{{className}} has no public method \"{{method}}\" in {{source}}; test through a public method.",
      outside: "Put this test inside a describe named \"{{className}}.<method>()\".",
    },
  },
  create(context) {
    const className = fileStemOf(context.filename).replace(TEST_SUFFIX, "");
    const testFolder = dirname(resolve(context.filename));
    const sourcePath = join(testFolder, `${className}${SOURCE_EXTENSION}`);
    let publicMethods;
    const methodsOfSource = () => {
      publicMethods ??= existsSync(sourcePath) ? publicMethodsOf(sourcePath, className) : new Set();
      return publicMethods;
    };
    const checkDescribe = (call) => {
      const title = call.arguments[0];
      const match = DESCRIBE_TARGET.exec(typeof title?.value === "string" ? title.value : "");
      if (!match) {
        context.report({ node: title ?? call, messageId: "format", data: { className } });
        return;
      }
      const [, named, method] = match;
      if (named !== className) {
        context.report({ node: title, messageId: "otherClass", data: { className, named } });
        return;
      }
      if (!methodsOfSource().has(method)) {
        context.report({ node: title, messageId: "notPublic", data: { className, method, source: `${className}${SOURCE_EXTENSION}` } });
      }
    };
    const reportOutside = (call) => {
      context.report({ node: call, messageId: "outside", data: { className } });
    };
    const CALLEE_TO_CHECK = { describe: checkDescribe, it: reportOutside, test: reportOutside };
    return {
      "Program"(program) {
        for (const statement of program.body) {
          const name = calleeNameOf(statement);
          const check = Object.hasOwn(CALLEE_TO_CHECK, name ?? "") ? CALLEE_TO_CHECK[name] : undefined;
          check?.(statement.expression);
        }
      },
    };
  },
};

const MAP_TYPE_NAMES = new Set(["Record", "Map", "ReadonlyMap"]);
const WRAPPER_TYPE_NAMES = new Set(["Partial", "Readonly", "Required"]);
const MAP_NAME = /To[A-Z0-9]|_TO_/;

function mapTypeOf(typeNode) {
  const name = typeNode?.typeName?.name;
  const typeArguments = typeNode?.typeArguments?.params ?? [];
  if (WRAPPER_TYPE_NAMES.has(name)) {
    return mapTypeOf(typeArguments[0]);
  }
  return MAP_TYPE_NAMES.has(name) ? typeArguments : undefined;
}

function isMapOfUnknown(typeArguments) {
  return typeArguments[1]?.type === "TSUnknownKeyword";
}

function isMapConstruction(init) {
  return init?.type === "NewExpression" && MAP_TYPE_NAMES.has(init.callee.name);
}

const mapName = {
  meta: {
    type: "suggestion",
    messages: {
      unnamed: "Name this map after its key and value (\"{{example}}\"), so a reader knows what a lookup takes and gives.",
    },
  },
  create(context) {
    const check = (nameNode, typeNode, init) => {
      const typeArguments = mapTypeOf(typeNode);
      const isMap = (typeArguments !== undefined && !isMapOfUnknown(typeArguments)) || isMapConstruction(init);
      const name = nameNode?.name;
      if (isMap && name && !MAP_NAME.test(name)) {
        context.report({ node: nameNode, messageId: "unnamed", data: { example: "suggestionIdToCost" } });
      }
    };
    return {
      "VariableDeclarator"(node) {
        check(node.id, node.id.typeAnnotation?.typeAnnotation, node.init);
      },
      "PropertyDefinition, TSPropertySignature"(node) {
        check(node.key, node.typeAnnotation?.typeAnnotation, node.value);
      },
      "TSTypeAliasDeclaration"(node) {
        check(node.id, node.typeAnnotation);
      },
      ":function > Identifier.params"(node) {
        check(node, node.typeAnnotation?.typeAnnotation);
      },
    };
  },
};

const LIST_TYPE_NAMES = new Set(["Array", "ReadonlyArray"]);

function isStringKeyword(typeNode) {
  return typeNode?.type === "TSStringKeyword";
}

function unwrapRecord(typeNode) {
  let current = typeNode;
  while (current?.type === "TSTypeReference" && WRAPPER_TYPE_NAMES.has(current.typeName.name)) {
    current = current.typeArguments?.params[0];
  }
  return current;
}

function isRecordOfStringKeys(typeNode) {
  const record = unwrapRecord(typeNode);
  return record?.type === "TSTypeReference" && record.typeName.name === "Record" && isStringKeyword(record.typeArguments?.params[0]);
}

function isListOfStrings(typeNode) {
  if (typeNode?.type === "TSTypeOperator" && typeNode.operator === "readonly") {
    return isListOfStrings(typeNode.typeAnnotation);
  }
  if (typeNode?.type === "TSArrayType") {
    return isStringKeyword(typeNode.elementType);
  }
  return typeNode?.type === "TSTypeReference" && LIST_TYPE_NAMES.has(typeNode.typeName.name) && isStringKeyword(typeNode.typeArguments?.params[0]);
}

function hasOnlyFixedKeys(objectNode) {
  return objectNode.properties.length > 0
    && objectNode.properties.every((property) => property.type === "Property" && !property.computed);
}

function hasOnlyFixedStrings(arrayNode) {
  return arrayNode.elements.length > 0
    && arrayNode.elements.every((element) => element?.type === "Literal" && typeof element.value === "string");
}

const MIN_TABLE_ENTRIES = 2;

const knownKeys = {
  meta: {
    type: "suggestion",
    schema: [{ type: "object", properties: { inferred: { type: "boolean" } }, additionalProperties: false }],
    messages: {
      keys: "The keys here are all known: type them as a union (Record<SomeName, ...>) instead of string, so a typo fails to compile.",
      values: "The values here are all known: type the list as an array of a union (readonly SomeName[]) instead of string[].",
      inferredList: "An untyped list of string literals is inferred as string[]: annotate it with a union (readonly SomeName[]).",
      inferredTable: "An untyped table of string literals is inferred as { key: string }: annotate it (Record<SomeName, SomeValue>).",
    },
  },
  create(context) {
    const check = (typeNode, init, reportNode) => {
      if (isRecordOfStringKeys(typeNode) && init?.type === "ObjectExpression" && hasOnlyFixedKeys(init)) {
        context.report({ node: reportNode, messageId: "keys" });
      }
      if (isListOfStrings(typeNode) && init?.type === "ArrayExpression" && hasOnlyFixedStrings(init)) {
        context.report({ node: reportNode, messageId: "values" });
      }
    };
    const checkInferred = (typeNode, init, reportNode) => {
      if (typeNode || !init) {
        return;
      }
      if (init.type === "ArrayExpression" && hasOnlyFixedStrings(init)) {
        context.report({ node: reportNode, messageId: "inferredList" });
      }
      if (init.type === "ObjectExpression" && hasOnlyFixedKeys(init) && init.properties.length >= MIN_TABLE_ENTRIES
        && init.properties.every((property) => property.value.type === "Literal" && typeof property.value.value === "string")) {
        context.report({ node: reportNode, messageId: "inferredTable" });
      }
    };
    return {
      "VariableDeclarator"(node) {
        check(node.id.typeAnnotation?.typeAnnotation, node.init, node.id);
        if (context.options[0]?.inferred) {
          checkInferred(node.id.typeAnnotation, node.init, node.id);
        }
      },
      "PropertyDefinition"(node) {
        check(node.typeAnnotation?.typeAnnotation, node.value, node.key);
        if (context.options[0]?.inferred) {
          checkInferred(node.typeAnnotation, node.value, node.key);
        }
      },
    };
  },
  defaultOptions: [{ inferred: false }],
};

export const localRules = {
  rules: {
    "comment-marker": commentMarker,
    "literal-dispatch": literalDispatch,
    "class-matches-file": classMatchesFile,
    "describe-target": describeTarget,
    "comment-placement": commentPlacement,
    "map-name": mapName,
    "known-keys": knownKeys,
  },
};
