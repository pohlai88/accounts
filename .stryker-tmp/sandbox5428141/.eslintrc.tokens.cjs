/**
 * Anti-Drift ESLint Rules for Token System
 *
 * This configuration prevents raw CSS, hex colors, and arbitrary Tailwind values
 * to ensure all styling goes through the @aibos/tokens design system.
 */
// @ts-nocheck


module.exports = {
  plugins: ["tailwindcss"],
  rules: {
    // Prevent inline styles (use Tailwind classes instead)
    "no-restricted-syntax": [
      "error",
      {
        selector: "JSXAttribute[name.name='style']",
        message: "Inline styles are forbidden. Use Tailwind classes with semantic tokens instead.",
      },
    ],

    // Prevent raw hex colors in strings
    "no-restricted-properties": [
      "error",
      {
        object: "StringLiteral",
        property: "raw",
        message:
          "Raw hex colors are forbidden. Use semantic token classes like 'bg-brand-solid' instead.",
      },
    ],

    // Allow custom classnames but warn about non-semantic usage
    "tailwindcss/no-custom-classname": "off",

    // Enforce consistent class ordering
    "tailwindcss/classnames-order": "warn",
  },

  // Custom regex patterns to catch common violations
  overrides: [
    {
      files: ["**/*.{ts,tsx,js,jsx}"],
      rules: {
        // Prevent hex color patterns and arbitrary Tailwind values
        "no-restricted-syntax": [
          "error",
          {
            selector: "Literal[value=/^#[0-9A-Fa-f]{3,6}$/]",
            message: "Hex colors are forbidden. Use semantic token classes instead.",
          },
          {
            selector: "TemplateLiteral[quasis.0.value.raw=/^#[0-9A-Fa-f]{3,6}$/]",
            message:
              "Hex colors in template literals are forbidden. Use semantic token classes instead.",
          },
          {
            selector: "Literal[value=/^\\[.*\\]$/]",
            message: "Arbitrary Tailwind values are forbidden. Use semantic token classes instead.",
          },
          {
            selector: "Property[key.name=/^(backgroundColor|color|borderColor|fill|stroke)$/]",
            message:
              "Raw color properties are forbidden. Use Tailwind classes with semantic tokens instead.",
          },
        ],
      },
    },
  ],
};
