// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'no-console': 'warn',
    'quotes': ['error', 'single'],
    'vue/first-attribute-linebreak': ['off', {
      'singleline': 'ignore',
      'multiline': 'below'
    }]
  },
})
