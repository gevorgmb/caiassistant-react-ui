import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  empty: string;
  variant?: "card" | "plain";
};

export function MarkdownContent({
  content,
  empty,
  variant = "card",
}: MarkdownContentProps) {
  const text = content.trim();
  if (!text) {
    return variant === "plain" ? (
      <>{empty}</>
    ) : (
      <p className="page-lede">{empty}</p>
    );
  }

  return (
    <div
      className={
        variant === "plain"
          ? "assistant-markdown assistant-markdown--plain"
          : "assistant-markdown"
      }
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
