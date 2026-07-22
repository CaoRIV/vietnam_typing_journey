import path from "node:path";
import { pathToFileURL } from "node:url";

const playwrightEntry = pathToFileURL(
  path.resolve(process.cwd(), "node_modules/playwright/index.mjs"),
).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "playwright") {
    return { url: playwrightEntry, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
