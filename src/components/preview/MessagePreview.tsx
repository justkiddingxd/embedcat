"use client";

import React, { createContext, useContext, useState } from "react";
import { ImageIcon } from "lucide-react";
import { useBuilderStore } from "@/store/builder-store";
import { useMentionResolver } from "@/hooks/use-mention-resolver";
import type {
  DiscordEmbed,
  TopLevelComponent,
  ContainerComponent,
  TextDisplayComponent,
  SectionComponent,
  SeparatorComponent,
  ActionRowComponent,
  ButtonComponent,
  MediaGalleryComponent,
  ThumbnailComponent,
  MediaGalleryItem,
} from "@/types/discord";
import { ComponentType, ButtonStyle } from "@/types/discord";
import { EMBEDCAT_LOGO_URL } from "@/lib/utils";

interface MentionResolver {
  resolveUser: (id: string) => { display_name: string } | null;
  resolveRole: (id: string) => { name: string; color: number } | null;
}

export const MentionCtx = createContext<MentionResolver>({
  resolveUser: () => null,
  resolveRole: () => null,
});

function UserMentionPill({ id }: { id: string }) {
  const { resolveUser } = useContext(MentionCtx);
  const user = resolveUser(id);
  const label = user ? `@${user.display_name}` : `@Unknown User`;
  return (
    <span className="inline rounded-[3px] bg-[#5865f2]/25 px-[2px] text-[#c9cdfb] hover:bg-[#5865f2]/40 cursor-pointer font-medium">
      {label}
    </span>
  );
}

function RoleMentionPill({ id }: { id: string }) {
  const { resolveRole } = useContext(MentionCtx);
  const role = resolveRole(id);
  const label = role ? `@${role.name}` : `@role`;
  const color = role && role.color !== 0 ? `#${role.color.toString(16).padStart(6, "0")}` : "#c9cdfb";
  return (
    <span
      className="inline rounded-[3px] px-[2px] hover:brightness-125 cursor-pointer font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {label}
    </span>
  );
}

function ChannelMentionPill({ id }: { id: string }) {
  return (
    <span className="inline rounded-[3px] bg-[#5865f2]/25 px-[2px] text-[#c9cdfb] hover:bg-[#5865f2]/40 cursor-pointer font-medium">
      #channel-{id.slice(-4)}
    </span>
  );
}

function CustomEmoji({ name, id, animated }: { name: string; id: string; animated: boolean }) {
  const src = animated
    ? `https://cdn.discordapp.com/emojis/${id}.webp?size=96&animated=true`
    : `https://cdn.discordapp.com/emojis/${id}.webp?size=96`;
  return (
    <img
      src={src}
      alt={`:${name}:`}
      title={`:${name}:`}
      className="inline-block h-5 w-5 align-[-4px] object-contain"
      draggable={false}
    />
  );
}

function intToHex(color: number | undefined): string {
  if (color === undefined) return "#202225";
  return `#${color.toString(16).padStart(6, "0")}`;
}

function currentTimestamp(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `Today at ${h12}:${minutes} ${ampm}`;
}

function formatEmbedTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return ts;
  }
}

type MarkdownNode =
  | { type: "text"; value: string }
  | { type: "bold"; children: MarkdownNode[] }
  | { type: "italic"; children: MarkdownNode[] }
  | { type: "underline"; children: MarkdownNode[] }
  | { type: "strikethrough"; children: MarkdownNode[] }
  | { type: "code"; value: string }
  | { type: "code_block"; value: string }
  | { type: "spoiler"; children: MarkdownNode[] }
  | { type: "link"; text: string; url: string }
  | { type: "user_mention"; id: string }
  | { type: "role_mention"; id: string }
  | { type: "channel_mention"; id: string }
  | { type: "custom_emoji"; name: string; id: string; animated: boolean };

function parseInlineMarkdown(text: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  const regex =
    /```([^`]*?)```|__(.+?)__|~~(.+?)~~|\*\*(.+?)\*\*|\*(.+?)\*|(?<!`)`(?!`)([^`]+)`(?!`)|\|\|(.+?)\|\||\[([^\]]+)\]\(([^)]+)\)|<@!?(\d{17,20})>|<@&(\d{17,20})>|<#(\d{17,20})>|<(a?):(\w+):(\d{17,20})>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      nodes.push({ type: "code_block", value: match[1] });
    } else if (match[2] !== undefined) {
      nodes.push({ type: "underline", children: [{ type: "text", value: match[2] }] });
    } else if (match[3] !== undefined) {
      nodes.push({ type: "strikethrough", children: [{ type: "text", value: match[3] }] });
    } else if (match[4] !== undefined) {
      nodes.push({ type: "bold", children: [{ type: "text", value: match[4] }] });
    } else if (match[5] !== undefined) {
      nodes.push({ type: "italic", children: [{ type: "text", value: match[5] }] });
    } else if (match[6] !== undefined) {
      nodes.push({ type: "code", value: match[6] });
    } else if (match[7] !== undefined) {
      nodes.push({ type: "spoiler", children: [{ type: "text", value: match[7] }] });
    } else if (match[8] !== undefined && match[9] !== undefined) {
      nodes.push({ type: "link", text: match[8], url: match[9] });
    } else if (match[10] !== undefined) {
      nodes.push({ type: "user_mention", id: match[10] });
    } else if (match[11] !== undefined) {
      nodes.push({ type: "role_mention", id: match[11] });
    } else if (match[12] !== undefined) {
      nodes.push({ type: "channel_mention", id: match[12] });
    } else if (match[14] !== undefined && match[15] !== undefined) {
      nodes.push({ type: "custom_emoji", name: match[14], id: match[15], animated: match[13] === "a" });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }
  return nodes;
}

function RenderInline({ nodes }: { nodes: MarkdownNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case "text":
            return <span key={i}>{node.value}</span>;
          case "bold":
            return (
              <strong key={i} className="font-semibold text-[#f2f3f5]">
                <RenderInline nodes={node.children} />
              </strong>
            );
          case "italic":
            return (
              <em key={i}>
                <RenderInline nodes={node.children} />
              </em>
            );
          case "underline":
            return (
              <u key={i} className="underline">
                <RenderInline nodes={node.children} />
              </u>
            );
          case "strikethrough":
            return (
              <s key={i} className="line-through">
                <RenderInline nodes={node.children} />
              </s>
            );
          case "code":
            return (
              <code
                key={i}
                className="rounded-[3px] bg-[#1e1f22] px-[4px] py-[1px] font-mono text-[0.85em] text-[#e8e8e8]"
              >
                {node.value}
              </code>
            );
          case "code_block":
            return (
              <pre
                key={i}
                className="my-0.5 rounded-[4px] bg-[#2b2d31] border border-[#1e1f22] text-[0.875rem] leading-[1.375rem] font-mono text-[#dbdee1] overflow-x-auto whitespace-pre-wrap break-words"
              >
                <code className="block py-[0.5em] px-[0.6em]">{node.value}</code>
              </pre>
            );
          case "spoiler":
            return (
              <span
                key={i}
                className="group/spoiler cursor-pointer rounded-[3px] bg-[#1e1f22] transition-colors hover:bg-transparent"
              >
                <span className="invisible group-hover/spoiler:visible">
                  <RenderInline nodes={node.children} />
                </span>
              </span>
            );
          case "link":
            return (
              <a
                key={i}
                href={node.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00aaff] hover:underline"
              >
                {node.text}
              </a>
            );
          case "user_mention":
            return <UserMentionPill key={i} id={node.id} />;
          case "role_mention":
            return <RoleMentionPill key={i} id={node.id} />;
          case "channel_mention":
            return <ChannelMentionPill key={i} id={node.id} />;
          case "custom_emoji":
            return <CustomEmoji key={i} name={node.name} id={node.id} animated={node.animated} />;
        }
      })}
    </>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks (```)
    if (line.startsWith("```")) {
      // Single-line code block: ```content``` on same line
      const rest = line.slice(3);
      const closeIdx = rest.indexOf("```");
      if (closeIdx >= 0) {
        const content = rest.slice(0, closeIdx);
        result.push(
          <pre
            key={`cb-${i}`}
            className="my-0.5 rounded-[4px] bg-[#2b2d31] border border-[#1e1f22] text-[0.875rem] leading-[1.375rem] font-mono text-[#dbdee1] overflow-x-auto whitespace-pre-wrap break-words"
          >
            <code className="block py-[0.5em] px-[0.6em]">{content}</code>
          </pre>
        );
        i++;
        continue;
      }
      // Multi-line: check if there's a closing ``` on a later line
      let hasClose = false;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith("```")) { hasClose = true; break; }
      }
      if (hasClose) {
        const lang = rest.trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; // skip closing ```
        result.push(
          <pre
            key={`cb-${i}`}
            className="my-0.5 rounded-[4px] bg-[#2b2d31] border border-[#1e1f22] text-[0.875rem] leading-[1.375rem] font-mono text-[#dbdee1] overflow-x-auto whitespace-pre-wrap break-words"
          >
            <code className="block py-[0.5em] px-[0.6em]">{codeLines.join("\n")}</code>
          </pre>
        );
        continue;
      }
      // No closing ``` — render as normal text
      result.push(renderSingleLine(line, i));
      i++;
      continue;
    }

    if (line.startsWith(">>>")) {
      const textAfter = line.startsWith(">>> ") ? line.slice(4) : line.slice(3);
      const quoteLines = [textAfter, ...lines.slice(i + 1)];
      result.push(
        <div key={i} className="flex pl-0 my-0.5">
          <div className="w-1 rounded-full bg-[#4e5058] mr-[0.7rem] shrink-0" />
          <blockquote className="leading-[1.375rem]">{renderMarkdownLines(quoteLines)}</blockquote>
        </div>
      );
      i = lines.length;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      result.push(
        <div key={`q-${i}`} className="flex pl-0 my-0.5">
          <div className="w-1 rounded-full bg-[#4e5058] mr-[0.7rem] shrink-0" />
          <blockquote className="leading-[1.375rem]">{renderMarkdownLines(quoteLines)}</blockquote>
        </div>
      );
      continue;
    }

    result.push(renderSingleLine(line, i));
    i++;
  }

  return result;
}

function renderSingleLine(line: string, key: number): React.ReactNode {
  if (line.startsWith("### ")) {
    return (
      <div key={key} className="text-sm font-bold text-[#f2f3f5] leading-relaxed">
        <RenderInline nodes={parseInlineMarkdown(line.slice(4))} />
      </div>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <div key={key} className="text-base font-bold text-[#f2f3f5] leading-relaxed">
        <RenderInline nodes={parseInlineMarkdown(line.slice(3))} />
      </div>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <div key={key} className="text-xl font-bold text-[#f2f3f5] leading-relaxed">
        <RenderInline nodes={parseInlineMarkdown(line.slice(2))} />
      </div>
    );
  }
  if (line.startsWith("-# ")) {
    return (
      <div key={key} className="text-xs text-[#949ba4] leading-relaxed">
        <RenderInline nodes={parseInlineMarkdown(line.slice(3))} />
      </div>
    );
  }
  if (line === "") {
    return <br key={key} />;
  }
  return (
    <div key={key} className="leading-[1.375rem]">
      <RenderInline nodes={parseInlineMarkdown(line)} />
    </div>
  );
}

function renderMarkdownLines(lines: string[]): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    result.push(renderSingleLine(lines[i], i));
  }
  return result;
}

function EmbedCard({ embed }: { embed: DiscordEmbed }) {
  const borderColor = intToHex(embed.color);
  const hasContent =
    embed.title ||
    embed.description ||
    embed.author?.name ||
    embed.footer?.text ||
    embed.image?.url ||
    embed.thumbnail?.url ||
    (embed.fields?.length ?? 0) > 0;

  if (!hasContent) return null;

  return (
    <div
      className="mt-1 flex max-w-[516px] rounded-[4px] border-l-[4px] bg-[#2b2d31]"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex-1 overflow-hidden p-3">
        {embed.author?.name && (
          <div className="mb-1 flex items-center gap-2">
            {embed.author.icon_url && (
              <img
                src={embed.author.icon_url}
                alt=""
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-full object-cover"
              />
            )}
            {embed.author.url ? (
              <a
                href={embed.author.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#f2f3f5] hover:underline"
              >
                {embed.author.name}
              </a>
            ) : (
              <span className="text-sm font-medium text-[#f2f3f5]">
                {embed.author.name}
              </span>
            )}
          </div>
        )}

        {embed.title && (
          <div className="mb-1">
            {embed.url ? (
              <a
                href={embed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00aaff] font-semibold leading-snug hover:underline"
              >
                {embed.title}
              </a>
            ) : (
              <div className="font-semibold text-[#f2f3f5] leading-snug">
                {embed.title}
              </div>
            )}
          </div>
        )}

        {embed.description && (
          <div className="mb-2 text-sm text-[#dcddde] leading-[1.125rem]">
            {renderMarkdown(embed.description)}
          </div>
        )}

        {(embed.fields?.length ?? 0) > 0 && (
          <div className="mb-2 grid grid-cols-3 gap-2">
            {(embed.fields ?? []).map((field) => (
              <div
                key={field.id}
                className={field.inline ? "col-span-1" : "col-span-3"}
              >
                <div className="text-xs font-semibold text-[#f2f3f5] leading-snug">
                  {renderMarkdown(field.name)}
                </div>
                <div className="text-sm text-[#dcddde] leading-[1.125rem]">
                  {renderMarkdown(field.value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {embed.image?.url && (
          <div className="mt-2">
            <img
              src={embed.image.url}
              alt=""
              referrerPolicy="no-referrer"
              className="max-w-[400px] rounded object-cover"
            />
          </div>
        )}

        {(embed.footer?.text || embed.timestamp) && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#949ba4]">
            {embed.footer?.icon_url && (
              <img
                src={embed.footer.icon_url}
                alt=""
                referrerPolicy="no-referrer"
                className="h-5 w-5 rounded-full object-cover"
              />
            )}
            {embed.footer?.text && <span>{embed.footer.text}</span>}
            {embed.footer?.text && embed.timestamp && <span>{"  \u2022  "}</span>}
            {embed.timestamp && <span>{formatEmbedTimestamp(embed.timestamp)}</span>}
          </div>
        )}
      </div>

      {embed.thumbnail?.url && (
        <div className="flex-shrink-0 p-3 pl-0">
          <img
            src={embed.thumbnail.url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-[80px] w-[80px] rounded object-cover"
          />
        </div>
      )}
    </div>
  );
}

function ButtonPreview({ button }: { button: ButtonComponent }) {
  const baseClasses =
    "inline-flex items-center gap-1.5 rounded-[3px] px-4 py-[2px] text-sm font-medium h-8 min-w-[60px] justify-center transition-all duration-100 select-none cursor-pointer";

  const styleMap: Record<number, string> = {
    [ButtonStyle.Primary]: "bg-[#5865f2] text-white hover:bg-[#4752c4]",
    [ButtonStyle.Secondary]: "bg-[#4e5058] text-white hover:bg-[#6d6f78]",
    [ButtonStyle.Success]: "bg-[#248046] text-white hover:bg-[#1a6334]",
    [ButtonStyle.Danger]: "bg-[#da373c] text-white hover:bg-[#a12d31]",
    [ButtonStyle.Link]: "bg-[#4e5058] text-white hover:bg-[#6d6f78]",
  };

  const linkIcon = (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-0.5 opacity-70"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );

  const content = (
    <>
      {button.emoji && <span>{button.emoji.name}</span>}
      {button.label && <span>{button.label}</span>}
      {button.style === ButtonStyle.Link && linkIcon}
    </>
  );

  if (button.style === ButtonStyle.Link && button.url) {
    return (
      <a
        href={button.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${styleMap[ButtonStyle.Link]} no-underline`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={`${baseClasses} ${styleMap[button.style] ?? styleMap[ButtonStyle.Secondary]}`}
    >
      {content}
    </div>
  );
}

function RenderActionRow({ component }: { component: ActionRowComponent }) {
  return (
    <div className="flex flex-wrap gap-2 py-0.5">
      {component.components.map((btn) => (
        <ButtonPreview key={btn.id} button={btn} />
      ))}
    </div>
  );
}

function RenderTextDisplay({ component }: { component: TextDisplayComponent }) {
  if (!component.content) return null;
  return (
    <div className="text-sm text-[#dcddde] py-0.5">
      {renderMarkdown(component.content)}
    </div>
  );
}

function RenderThumbnail({ component }: { component: ThumbnailComponent }) {
  if (!component.media.url) return null;
  return (
    <img
      src={component.media.url}
      alt={component.description ?? ""}
      referrerPolicy="no-referrer"
      className="h-[80px] w-[80px] rounded object-cover"
    />
  );
}

function isVideoUrl(url: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  return path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov");
}

function MediaItem({ item }: { item: MediaGalleryItem }) {
  const [errored, setErrored] = useState(false);
  const url = item.media.url;

  if (errored) {
    return (
      <div className="flex items-center justify-center w-full h-[120px] rounded bg-[#2b2d31] text-[#52525b]">
        <ImageIcon className="size-8" />
      </div>
    );
  }

  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        className="w-full rounded object-cover max-h-[300px]"
        autoPlay
        loop
        muted
        playsInline
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <img
      src={url}
      alt={item.description ?? ""}
      referrerPolicy="no-referrer"
      className="w-full rounded object-cover max-h-[300px]"
      onError={() => setErrored(true)}
    />
  );
}

function RenderMediaGallery({ component }: { component: MediaGalleryComponent }) {
  const items = component.items.filter((item: MediaGalleryItem) => item.media.url);
  if (items.length === 0) return null;

  const gridClass =
    items.length === 1
      ? "grid-cols-1"
      : items.length === 2
        ? "grid-cols-2"
        : "grid-cols-2";

  return (
    <div className={`grid ${gridClass} gap-1 py-0.5`}>
      {items.map((item: MediaGalleryItem, idx: number) => (
        <div
          key={item.id}
          className={
            items.length === 3 && idx === 0
              ? "col-span-2"
              : items.length > 3 && idx === 0 && items.length % 2 !== 0
                ? "col-span-2"
                : ""
          }
        >
          <MediaItem item={item} />
        </div>
      ))}
    </div>
  );
}

function RenderSeparator({ component }: { component: SeparatorComponent }) {
  const spacing = component.spacing === 2 ? "my-4" : "my-2";
  if (component.divider) {
    return <div className={`${spacing} h-px w-full bg-[#3f4147]`} />;
  }
  return <div className={spacing} />;
}

function RenderSection({ component }: { component: SectionComponent }) {
  return (
    <div className="flex items-start gap-3 py-0.5">
      <div className="flex-1 min-w-0">
        {component.components.map((child) => (
          <RenderTextDisplay key={child.id} component={child} />
        ))}
      </div>
      {component.accessory && (
        <div className="flex-shrink-0">
          {component.accessory.type === ComponentType.Thumbnail ? (
            <RenderThumbnail component={component.accessory} />
          ) : (
            <ButtonPreview button={component.accessory} />
          )}
        </div>
      )}
    </div>
  );
}

function RenderContainerChild({
  component,
}: {
  component: TopLevelComponent;
}) {
  switch (component.type) {
    case ComponentType.TextDisplay:
      return <RenderTextDisplay component={component} />;
    case ComponentType.ActionRow:
      return <RenderActionRow component={component} />;
    case ComponentType.Section:
      return <RenderSection component={component} />;
    case ComponentType.Separator:
      return <RenderSeparator component={component} />;
    case ComponentType.MediaGallery:
      return <RenderMediaGallery component={component} />;
    default:
      return null;
  }
}

function RenderContainer({ component }: { component: ContainerComponent }) {
  const borderColor = component.accent_color
    ? intToHex(component.accent_color)
    : undefined;

  return (
    <div
      className="mt-1 max-w-[516px] rounded-[4px] bg-[#2b2d31] p-3 overflow-hidden"
      style={
        borderColor
          ? { borderLeft: `4px solid ${borderColor}` }
          : undefined
      }
    >
      {component.components.filter((c) => !c.hidden).map((child) => (
        <RenderContainerChild key={child.id} component={child as TopLevelComponent} />
      ))}
    </div>
  );
}

function RenderTopLevel({ component }: { component: TopLevelComponent }) {
  switch (component.type) {
    case ComponentType.Container:
      return <RenderContainer component={component} />;
    case ComponentType.TextDisplay:
      return <RenderTextDisplay component={component} />;
    case ComponentType.ActionRow:
      return <RenderActionRow component={component} />;
    case ComponentType.Section:
      return <RenderSection component={component} />;
    case ComponentType.Separator:
      return <RenderSeparator component={component} />;
    case ComponentType.MediaGallery:
      return <RenderMediaGallery component={component} />;
    default:
      return null;
  }
}

export function ClassicPreview({
  content,
  embeds,
}: {
  content: string;
  embeds: DiscordEmbed[];
}) {
  return (
    <>
      {content && (
        <div className="text-[#dcddde] leading-[1.375rem]">
          {renderMarkdown(content)}
        </div>
      )}
      {embeds.filter((e) => !e.hidden).map((embed) => (
        <EmbedCard key={embed.id} embed={embed} />
      ))}
    </>
  );
}

export function ComponentsV2Preview({
  components,
}: {
  components: TopLevelComponent[];
}) {
  return (
    <>
      {components.filter((c) => !c.hidden).map((component) => (
        <RenderTopLevel key={component.id} component={component} />
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <p className="text-sm text-[#949ba4] italic">
        Your message preview will appear here
      </p>
    </div>
  );
}

export default function MessagePreview() {
  const mode = useBuilderStore((s) => s.mode);
  const content = useBuilderStore((s) => s.content);
  const embeds = useBuilderStore((s) => s.embeds);
  const components = useBuilderStore((s) => s.components);
  const webhook = useBuilderStore((s) => s.webhook);
  const botGuildId = useBuilderStore((s) => s.botGuildId);
  const resolver = useMentionResolver(webhook.url, botGuildId);

  const username = webhook.username || "embed.cat";
  const avatarUrl = webhook.avatar_url || EMBEDCAT_LOGO_URL;
  const timestamp = currentTimestamp();

  const isEmpty =
    mode === "classic"
      ? !content && embeds.every((e) => !e.title && !e.description && !e.author?.name && !e.footer?.text && !e.image?.url && !e.thumbnail?.url && e.fields.length === 0)
      : components.length === 0;

  return (
    <MentionCtx.Provider value={resolver}>
    <div className="h-full overflow-y-auto">
      <div className="min-h-full bg-[#313338] p-4" style={{ minHeight: "200px" }}>
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5865f2] text-lg">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[#f2f3f5] hover:underline cursor-pointer">
                  {username}
                </span>
                <span className="inline-flex items-center rounded-[3px] bg-[#5865f2] px-[4.4px] py-[0.8px] text-[10px] font-medium leading-[15px] text-white">
                  BOT
                </span>
                <span className="text-xs text-[#949ba4]">{timestamp}</span>
              </div>
              <div className="mt-0.5">
                {mode === "classic" ? (
                  <ClassicPreview content={content} embeds={embeds} />
                ) : (
                  <ComponentsV2Preview components={components} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </MentionCtx.Provider>
  );
}
