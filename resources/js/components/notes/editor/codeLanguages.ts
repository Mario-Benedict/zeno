import type { TranslationKey } from '@/i18n/dictionary';

export interface CodeLanguageOption {
  value: string;
  labelKey: TranslationKey;
}

/**
 * Matches the grammars registered in extensions/codeBlock.ts (lowlight's
 * `common` bundle) — keep these two lists in sync. "Plain Text" always
 * comes first, the rest are alphabetized by label like Notion's picker.
 */
export const CODE_LANGUAGES: CodeLanguageOption[] = [
  {
    value: 'plaintext',
    labelKey: 'notes.codeLanguagePlainText',
  },
  { value: 'arduino', labelKey: 'notes.codeLanguageArduino' },
  { value: 'bash', labelKey: 'notes.codeLanguageBash' },
  { value: 'c', labelKey: 'notes.codeLanguageC' },
  { value: 'cpp', labelKey: 'notes.codeLanguageCpp' },
  { value: 'csharp', labelKey: 'notes.codeLanguageCsharp' },
  { value: 'css', labelKey: 'notes.codeLanguageCss' },
  { value: 'diff', labelKey: 'notes.codeLanguageDiff' },
  { value: 'go', labelKey: 'notes.codeLanguageGo' },
  { value: 'graphql', labelKey: 'notes.codeLanguageGraphql' },
  { value: 'xml', labelKey: 'notes.codeLanguageXml' },
  { value: 'ini', labelKey: 'notes.codeLanguageIni' },
  { value: 'java', labelKey: 'notes.codeLanguageJava' },
  { value: 'javascript', labelKey: 'notes.codeLanguageJavascript' },
  { value: 'json', labelKey: 'notes.codeLanguageJson' },
  { value: 'kotlin', labelKey: 'notes.codeLanguageKotlin' },
  { value: 'less', labelKey: 'notes.codeLanguageLess' },
  { value: 'lua', labelKey: 'notes.codeLanguageLua' },
  { value: 'makefile', labelKey: 'notes.codeLanguageMakefile' },
  { value: 'markdown', labelKey: 'notes.codeLanguageMarkdown' },
  { value: 'objectivec', labelKey: 'notes.codeLanguageObjectivec' },
  { value: 'perl', labelKey: 'notes.codeLanguagePerl' },
  { value: 'php', labelKey: 'notes.codeLanguagePhp' },
  {
    value: 'php-template',
    labelKey: 'notes.codeLanguagePhpTemplate',
  },
  { value: 'python', labelKey: 'notes.codeLanguagePython' },
  {
    value: 'python-repl',
    labelKey: 'notes.codeLanguagePythonRepl',
  },
  { value: 'r', labelKey: 'notes.codeLanguageR' },
  { value: 'ruby', labelKey: 'notes.codeLanguageRuby' },
  { value: 'rust', labelKey: 'notes.codeLanguageRust' },
  { value: 'scss', labelKey: 'notes.codeLanguageScss' },
  { value: 'shell', labelKey: 'notes.codeLanguageShell' },
  { value: 'sql', labelKey: 'notes.codeLanguageSql' },
  { value: 'swift', labelKey: 'notes.codeLanguageSwift' },
  { value: 'typescript', labelKey: 'notes.codeLanguageTypescript' },
  { value: 'vbnet', labelKey: 'notes.codeLanguageVbnet' },
  { value: 'wasm', labelKey: 'notes.codeLanguageWasm' },
  { value: 'yaml', labelKey: 'notes.codeLanguageYaml' },
];
