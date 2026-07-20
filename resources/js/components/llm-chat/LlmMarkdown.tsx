import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface Props {
  text: string;
}

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'u',
    'ins',
    'mark',
    'sub',
    'sup',
  ],
};

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeRaw, [rehypeSanitize, sanitizeSchema]] as const;

const LlmMarkdown = ({ text }: Props) => (
  <div className="prose-chat">
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS as any}
    >
      {text}
    </ReactMarkdown>
  </div>
);

export default LlmMarkdown;
