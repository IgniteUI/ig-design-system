// The tests of the package. The site in site/ has its own, which need a built site.
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: { exclude: [...configDefaults.exclude, "site/**"] },
});
