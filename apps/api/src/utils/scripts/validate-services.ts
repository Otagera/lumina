#!/usr/bin/env bun
/**
 * Service Standard Validator
 * Checks that all services follow the standardized pattern
 *
 * Usage: bun run validate-services.ts
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
}

const SERVICES_DIR = join(__dirname, "..", "..", "services");
const ROUTES_DIR = join(__dirname, "..", "..", "routes");

function scanDirectory(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...scanDirectory(fullPath));
      } else if (entry.endsWith(".ts") || entry.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory doesn't exist or can't be read
  }

  return files;
}

function validateService(filePath: string): ValidationResult {
  const content = readFileSync(filePath, "utf-8");
  const errors: string[] = [];

  // Check for Joi import (case insensitive)
  if (!content.match(/import.*joi/i) && !content.includes("@lumina/utils")) {
    errors.push("Missing Joi import");
  }

  // Check for aliaserSpec usage
  if (!content.includes("aliaserSpec")) {
    errors.push("Missing aliaserSpec usage");
  }

  // Check for validateSpec usage
  if (!content.includes("validateSpec")) {
    errors.push("Missing validateSpec usage");
  }

  // Check for schema definition (case insensitive)
  if (!content.match(/joi\s*\.\s*object/i) && !content.match(/Joi\s*\.\s*object/i)) {
    errors.push("Missing Joi schema definition");
  }

  // Check for aliasSpec definition
  if (!content.includes("aliasSpec")) {
    errors.push("Missing aliasSpec definition");
  }

  return {
    file: filePath.replace(SERVICES_DIR, "services/"),
    valid: errors.length === 0,
    errors,
  };
}

function validateRoute(filePath: string): ValidationResult {
  const content = readFileSync(filePath, "utf-8");
  const errors: string[] = [];

  // Check for direct Prisma usage
  if (content.includes("prisma.") && !filePath.includes("middleware")) {
    errors.push("Direct Prisma usage detected - should use services");
  }

  // Check for direct model imports
  if (content.includes("packages/models/src") || content.includes("from \"../../../../packages/models")) {
    errors.push("Direct model import detected - should use services");
  }

  // Check line count (rough estimate) - just a warning
  const lines = content.split("\n").length;
  if (lines > 100 && !filePath.includes("middleware")) {
    errors.push(`Route has ${lines} lines - consider moving logic to services`);
  }

  return {
    file: filePath.replace(ROUTES_DIR, "routes/"),
    valid: errors.filter(e => !e.includes("lines")).length === 0, // Only fail on actual errors
    errors,
  };

  // Check for business logic patterns (simple heuristic)
  const businessLogicPatterns = [
    "await prisma",
    "from \"../../../../packages/models",
  ];

  const hasBusinessLogic = businessLogicPatterns.some(pattern => content.includes(pattern));
  if (hasBusinessLogic && !filePath.includes("middleware")) {
    errors.push("Direct Prisma usage detected - should use services");
  }

  return {
    file: filePath.replace(ROUTES_DIR, "routes/"),
    valid: errors.length === 0,
    errors,
  };
}

function main() {
  console.log("🔍 Validating Service Standards...\n");

  const results: ValidationResult[] = [];

  // Validate services
  console.log("📁 Checking services...");
  const serviceFiles = scanDirectory(SERVICES_DIR);
  for (const file of serviceFiles) {
    if (file.endsWith(".service.ts")) {
      const result = validateService(file);
      results.push(result);

      if (!result.valid) {
        console.log(`❌ ${result.file}`);
        result.errors.forEach(err => console.log(`   - ${err}`));
      } else {
        console.log(`✅ ${result.file}`);
      }
    }
  }

  // Validate routes
  console.log("\n📁 Checking routes...");
  const routeFiles = scanDirectory(ROUTES_DIR);
  for (const file of routeFiles) {
    if (file.endsWith(".route.ts")) {
      const result = validateRoute(file);
      results.push(result);

      if (!result.valid) {
        console.log(`❌ ${result.file}`);
        result.errors.forEach(err => console.log(`   - ${err}`));
      } else {
        console.log(`✅ ${result.file}`);
      }
    }
  }

  // Summary
  const invalid = results.filter(r => !r.valid);

  // Only count actual errors (not warnings like "has X lines")
  const actualErrors = invalid.filter(r =>
    !r.errors.every(e => e.includes("lines"))
  );

  console.log(`\n📊 Summary: ${results.length - actualErrors.length}/${results.length} files valid`);

  if (actualErrors.length > 0) {
    console.log("\n⚠️  Invalid files:");
    actualErrors.forEach(r => {
      console.log(`   ${r.file}: ${r.errors.join(", ")}`);
    });
    process.exit(1);
  } else {
    console.log("\n✅ All files follow the standard!");
  }
}

main();
