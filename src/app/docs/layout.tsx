import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — embed.cat",
  description: "Learn how to use embed.cat to build Discord embeds, Components V2 messages, and the AI assistant.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
