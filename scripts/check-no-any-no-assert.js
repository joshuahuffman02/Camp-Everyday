#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function loadTypescript() {
  const candidates = [
    () => require("typescript"),
    () => require(path.join(repoRoot, "platform/apps/web/node_modules/typescript")),
    () => require(path.join(repoRoot, "platform/apps/api/node_modules/typescript")),
    () => require(path.join(repoRoot, "platform/packages/shared/node_modules/typescript")),
  ];

  for (const load of candidates) {
    try {
      return load();
    } catch (error) {
      if (error && error.code !== "MODULE_NOT_FOUND") {
        throw error;
      }
    }
  }

  throw new Error("Unable to resolve TypeScript; install it or update check script paths.");
}

const ts = loadTypescript();

const extensions = [".ts", ".tsx"];
const exclude = [
  "**/node_modules/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.turbo/**",
  "**/.vercel/**",
  "**/out/**",
  "**/tmp/**",
];

const files = ts.sys.readDirectory(repoRoot, extensions, exclude, ["**/*"]);

const issues = [];

function reportIssue(sourceFile, node, message) {
  const { line, character } = ts.getLineAndCharacterOfPosition(
    sourceFile,
    node.getStart(sourceFile, false),
  );

  issues.push({
    file: sourceFile.fileName,
    line: line + 1,
    column: character + 1,
    message,
  });
}

function visit(sourceFile, node) {
  if (node.kind === ts.SyntaxKind.AnyKeyword) {
    reportIssue(sourceFile, node, "explicit any type");
  }

  if (
    node.kind === ts.SyntaxKind.AsExpression ||
    node.kind === ts.SyntaxKind.TypeAssertionExpression
  ) {
    reportIssue(sourceFile, node, "type assertion");
  }

  ts.forEachChild(node, (child) => visit(sourceFile, child));
}

for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");
  const isTsx = filePath.endsWith(".tsx");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  visit(sourceFile, sourceFile);
}

if (issues.length > 0) {
  issues.sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file);
    }
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    return a.column - b.column;
  });

  console.error(`Found ${issues.length} disallowed type usages:`);
  for (const issue of issues) {
    console.error(`${issue.file}:${issue.line}:${issue.column} ${issue.message}`);
  }
  process.exitCode = 1;
}
