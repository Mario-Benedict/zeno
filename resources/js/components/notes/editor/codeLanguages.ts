export interface CodeLanguageOption {
  value: string;
  label: string;
}

/**
 * Matches the grammars registered in extensions/codeBlock.ts (lowlight's
 * `common` bundle) — keep these two lists in sync. "Plain Text" always
 * comes first, the rest are alphabetized by label like Notion's picker.
 */
export const CODE_LANGUAGES: CodeLanguageOption[] = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'arduino', label: 'Arduino' },
  { value: 'bash', label: 'Bash' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'css', label: 'CSS' },
  { value: 'diff', label: 'Diff' },
  { value: 'go', label: 'Go' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'xml', label: 'HTML / XML' },
  { value: 'ini', label: 'INI' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'less', label: 'Less' },
  { value: 'lua', label: 'Lua' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'objectivec', label: 'Objective-C' },
  { value: 'perl', label: 'Perl' },
  { value: 'php', label: 'PHP' },
  { value: 'php-template', label: 'PHP Template' },
  { value: 'python', label: 'Python' },
  { value: 'python-repl', label: 'Python (REPL)' },
  { value: 'r', label: 'R' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rust', label: 'Rust' },
  { value: 'scss', label: 'SCSS' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'swift', label: 'Swift' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'vbnet', label: 'VB.NET' },
  { value: 'wasm', label: 'WebAssembly' },
  { value: 'yaml', label: 'YAML' },
];
