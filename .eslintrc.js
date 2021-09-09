module.exports = {
  parser: "@typescript-eslint/parser",
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error", // Anything that does not match to any rule will be treated as a error
    "no-useless-constructor": "off",
    "no-parameter-properties": "off",
    "import/no-absolute-path": "off",
    "max-len": ["error", { code: 120 }],
    semi: [2, "always"],
    indent: ["error", 2],
  },
};
