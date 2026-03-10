import { Cat, ArrowLeft, Bot, Layers, Box, Keyboard, Share2, Bookmark, MessageSquare, Palette, Zap, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — embed.cat",
  description: "Learn how to use embed.cat to build Discord embeds, Components V2 messages, and the AI assistant.",
};

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-white/[0.1] bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono text-[#a1a1aa]">
      {children}
    </kbd>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/[0.06] bg-[#111113] p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#5865f2]/10">
          {icon}
        </div>
        <h2 className="text-base font-bold text-[#e4e4e7]">{title}</h2>
      </div>
      <div className="space-y-3 text-sm text-[#a1a1aa] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[#a1a1aa]">{label}</span>
      <span className="font-mono text-xs text-[#e4e4e7] bg-white/[0.04] rounded px-2 py-0.5">{value}</span>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="sticky top-0 z-50 flex h-10 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-md px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#71717a] hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3" />
          Back to Editor
        </Link>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <Cat className="size-4 text-[#5865f2]" />
          <span className="text-xs font-bold tracking-tight text-white">embed.cat</span>
        </div>
        <div className="w-20" />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">Documentation</h1>
          <p className="text-sm text-[#71717a]">
            Everything you need to know about building Discord embeds with embed.cat.
          </p>
        </div>

        <div className="space-y-4">

          <SectionCard icon={<Zap className="size-4 text-[#5865f2]" />} title="Quick Start">
            <ol className="list-decimal list-inside space-y-2 text-[#a1a1aa]">
              <li>Choose a mode: <strong className="text-[#e4e4e7]">Classic</strong> for standard embeds or <strong className="text-[#e4e4e7]">Components V2</strong> for the new layout system.</li>
              <li>Fill in the fields in the builder on the left. The preview on the right updates live.</li>
              <li>Paste your webhook URL and click <strong className="text-[#e4e4e7]">Send</strong> to deliver the message to Discord.</li>
            </ol>
          </SectionCard>

          <SectionCard icon={<Layers className="size-4 text-[#5865f2]" />} title="Classic Embeds">
            <p>
              Classic embeds are the standard Discord rich embeds. Each message can have up to <strong className="text-[#e4e4e7]">10 embeds</strong> plus an optional text content.
            </p>
            <p>Available embed fields:</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><strong className="text-[#e4e4e7]">Title</strong> — heading text, can be a link</li>
              <li><strong className="text-[#e4e4e7]">Description</strong> — main body, supports Discord markdown</li>
              <li><strong className="text-[#e4e4e7]">Color</strong> — sidebar accent color (HSV picker included)</li>
              <li><strong className="text-[#e4e4e7]">Fields</strong> — key/value pairs, can be inline (up to 25)</li>
              <li><strong className="text-[#e4e4e7]">Author</strong> — name + icon at the top</li>
              <li><strong className="text-[#e4e4e7]">Footer</strong> — text + icon at the bottom</li>
              <li><strong className="text-[#e4e4e7]">Images</strong> — large image and/or small thumbnail</li>
              <li><strong className="text-[#e4e4e7]">Timestamp</strong> — date displayed next to footer</li>
            </ul>
          </SectionCard>

          <SectionCard icon={<Box className="size-4 text-[#5865f2]" />} title="Components V2">
            <p>
              Components V2 is Discord{"'"}s new layout system (<code className="text-xs bg-white/[0.06] rounded px-1.5 py-0.5 font-mono text-[#e4e4e7]">flags: 32768</code>). It gives you more control over message layout with containers, sections, media galleries, and buttons.
            </p>
            <p>Available component types:</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><strong className="text-[#e4e4e7]">Container</strong> — top-level wrapper with accent color</li>
              <li><strong className="text-[#e4e4e7]">Text Display</strong> — markdown text block</li>
              <li><strong className="text-[#e4e4e7]">Section</strong> — text with an accessory (thumbnail or button)</li>
              <li><strong className="text-[#e4e4e7]">Separator</strong> — divider line between sections</li>
              <li><strong className="text-[#e4e4e7]">Media Gallery</strong> — grid of images/GIFs (up to 10)</li>
              <li><strong className="text-[#e4e4e7]">Action Row</strong> — row of buttons (Link buttons only via webhook)</li>
            </ul>
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[12px] text-amber-300">
              <strong>Note:</strong> Webhooks only support Link buttons (with URL). Primary, Secondary, Success, and Danger buttons require a bot with interaction handling.
            </div>
          </SectionCard>

          <SectionCard icon={<Bot className="size-4 text-[#5865f2]" />} title="AI Assistant">
            <p>
              Click the <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5865f2] text-white align-middle mx-0.5"><Bot className="size-3" /></span> button in the bottom-right corner to open the AI chat.
            </p>
            <p className="font-medium text-[#e4e4e7]">What it can do:</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li>Create embeds from text descriptions — {'"'}make a blue welcome embed with 3 fields{'"'}</li>
              <li>Modify your current embed — {'"'}change the color to red{'"'}, {'"'}add a footer{'"'}</li>
              <li>Answer questions about Discord embed limits and formatting</li>
              <li>Generate Components V2 layouts from scratch</li>
              <li>Suggest designs, colors, and content</li>
            </ul>
            <p className="font-medium text-[#e4e4e7]">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li>The AI sees your current embed state as context</li>
              <li>When it generates an embed, you{"'"}ll see an <strong className="text-[#e4e4e7]">Apply Embed</strong> button — click to load it into the editor</li>
              <li>Chat sessions are saved — you can continue conversations later</li>
              <li>Responds in your language automatically</li>
            </ul>
            <div className="rounded-md bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-[12px] text-[#71717a]">
              Free users get <strong className="text-[#e4e4e7]">5 messages/day</strong>. Unlimited access is granted by the admin.
            </div>
          </SectionCard>

          <SectionCard icon={<Palette className="size-4 text-[#5865f2]" />} title="Markdown & Formatting">
            <p>
              Discord embeds support a subset of markdown. <strong className="text-[#e4e4e7]">Select text</strong> in any description or text field to bring up the floating markdown toolbar — quickly apply bold, italic, strikethrough, code, and links without typing syntax.
            </p>
            <p className="font-medium text-[#e4e4e7]">Basic formatting:</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">**bold**</code> — <strong className="text-[#e4e4e7]">bold</strong></li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">*italic*</code> — <em className="text-[#e4e4e7]">italic</em></li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">~~strike~~</code> — <span className="text-[#e4e4e7] line-through">strikethrough</span></li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">`code`</code> — <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">inline code</code></li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">[text](url)</code> — hyperlink</li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]"># Heading</code>, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">## Heading</code>, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">### Heading</code></li>
            </ul>
            <p className="font-medium text-[#e4e4e7]">Quotes & subtext:</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"> quote"}</code> — single-line blockquote</li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{">>> quote"}</code> — multi-line blockquote (everything below becomes a quote)</li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"-# small text"}</code> — <span className="text-[11px] text-[#71717a]">small gray subtext</span></li>
            </ul>
            <p className="font-medium text-[#e4e4e7]">Mentions & emoji:</p>
            <p>
              <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<@userId>"}</code> user, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<@&roleId>"}</code> role, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<#channelId>"}</code> channel
            </p>
            <p>
              <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<:name:id>"}</code> custom emoji, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<a:name:id>"}</code> animated emoji
            </p>
          </SectionCard>

          <SectionCard icon={<Keyboard className="size-4 text-[#5865f2]" />} title="Keyboard Shortcuts">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#a1a1aa]">Undo</span>
                <div className="flex gap-1"><Kbd>Ctrl</Kbd><span className="text-[#52525b]">+</span><Kbd>Z</Kbd></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a1a1aa]">Redo</span>
                <div className="flex gap-1"><Kbd>Ctrl</Kbd><span className="text-[#52525b]">+</span><Kbd>Shift</Kbd><span className="text-[#52525b]">+</span><Kbd>Z</Kbd></div>
              </div>
            </div>
            <p className="text-[12px] text-[#52525b] mt-2">
              Undo/redo supports up to 100 history snapshots.
            </p>
          </SectionCard>

          <SectionCard icon={<Share2 className="size-4 text-[#5865f2]" />} title="Sharing & Saving">
            <p className="font-medium text-[#e4e4e7]">Share Link</p>
            <p>
              Click <strong className="text-[#e4e4e7]">Link</strong> in the toolbar to generate a shareable URL. Anyone with the link can view and load your embed.
            </p>
            <p className="font-medium text-[#e4e4e7]">Save to Profile</p>
            <p>
              Sign in with Discord and click <strong className="text-[#e4e4e7]">Save</strong> to store embeds to your profile. Access them from the <strong className="text-[#e4e4e7]">Saved Embeds</strong> menu in the profile dropdown. Saving again updates the existing embed instead of creating a duplicate.
            </p>
          </SectionCard>

          <SectionCard icon={<MessageSquare className="size-4 text-[#5865f2]" />} title="JSON Editor">
            <p>
              Click the <code className="text-xs bg-white/[0.06] rounded px-1.5 py-0.5 font-mono text-[#e4e4e7]">{"{}"}</code> button in the toolbar to open the JSON editor. You can view and edit the raw payload in three formats:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><strong className="text-[#e4e4e7]">embed.cat</strong> — native format</li>
              <li><strong className="text-[#e4e4e7]">Nadeko</strong> — compatible with NadekoBot</li>
              <li><strong className="text-[#e4e4e7]">Discohook</strong> — compatible with Discohook format</li>
            </ul>
            <p>
              Paste JSON from any of these formats and click <strong className="text-[#e4e4e7]">Apply</strong> to load it into the editor.
            </p>
          </SectionCard>

          <section className="rounded-lg border border-white/[0.06] bg-[#111113] p-5">
            <h2 className="text-base font-bold text-[#e4e4e7] mb-4">Discord Embed Limits</h2>
            <div className="text-sm">
              <LimitRow label="Message content" value="2,000 chars" />
              <LimitRow label="Embeds per message" value="10" />
              <LimitRow label="Embed title" value="256 chars" />
              <LimitRow label="Embed description" value="4,096 chars" />
              <LimitRow label="Fields per embed" value="25" />
              <LimitRow label="Field name" value="256 chars" />
              <LimitRow label="Field value" value="1,024 chars" />
              <LimitRow label="Author name" value="256 chars" />
              <LimitRow label="Footer text" value="2,048 chars" />
              <LimitRow label="Total embed characters" value="6,000" />
              <LimitRow label="Webhook username" value="80 chars" />
              <LimitRow label="Media gallery items" value="10" />
            </div>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-[#5865f2] hover:text-[#7983f5] transition-colors"
          >
            <ArrowLeft className="size-3" />
            Back to Editor
          </Link>
          <div className="text-xs text-[#71717a]">
            Built with{" "}
            <img
              src="https://em-content.zobj.net/source/apple/391/red-heart_2764-fe0f.png"
              alt="❤️"
              className="inline-block h-3.5 w-3.5 align-[-2px]"
              draggable={false}
            />{" "}
            by{" "}
            <a
              href="https://rin.ms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a1a1aa] hover:text-white transition-colors"
            >
              rin.ms
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
