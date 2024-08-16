import pkg from "./package.json" with { type: "json" };

import typescript from "rollup-plugin-typescript2";

export default {
  input: "./src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    {
      file: pkg.module,
      format: "esm",
    },
    {
      dir: "umd",
      format: "umd",
      name: "VocabTerm",
    },
  ],
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: "es2015",
        },
      },
    }),
  ],
};
