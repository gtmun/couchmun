import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import { importX } from 'eslint-plugin-import-x';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.js';


const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	importX.flatConfigs.recommended,
	importX.flatConfigs.typescript,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: { 
				// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
				// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
				"no-undef": 'off',
				// Use Object.hasOwn or hasKey (from utils) instead.
				"no-restricted-syntax": ["error", "BinaryExpression[operator='in']"],
				// "any" use is too prevalent
				"@typescript-eslint/no-explicit-any": "off",
				// Ignore any variables that start with _
				// (since they probably are intentionally unused)
				"@typescript-eslint/no-unused-vars": ["error", {
					"varsIgnorePattern": "^_\\w*$",
					"argsIgnorePattern": "^_\\w*$",
				}],
				// Imports!
				'import-x/order': [
					'warn',
					{
						alphabetize: {
							order: 'asc',
							caseInsensitive: true
						},
						'newlines-between': 'always'
					}
				],
				// Remove cases that import plugin doesn't understand
				"import-x/default": "off",
				"import-x/no-unresolved": ["warn", { ignore: ["[~$]"] }],
				// Bugged?
				"import-x/no-named-as-default-member": "off",
				// import-x/no-duplicates causes some bugs, use eslint default instead
				"import-x/no-duplicates": "off",
				"no-duplicate-imports": "warn",
		},
		settings: {
			"import/resolver": {
				"typescript": true,
				"node": true,
			}
		}
	},
	{
		files: [
			'**/*.svelte',
			'**/*.svelte.ts',
			'**/*.svelte.js'
		],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	}
);
