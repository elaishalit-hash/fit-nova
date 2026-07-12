import ReactMarkdown from "react-markdown";

export function TermsBody({ markdown }: { markdown: string }) {
  return (
    <article className="terms-content max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}
