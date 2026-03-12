"use client";

import { useState, useEffect } from "react";
import { Cat, ArrowLeft, Bot, Layers, Box, Keyboard, Share2, MessageSquare, Palette, Zap, Globe, Send, HelpCircle, ChevronDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

function Fmt({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-[#e4e4e7]">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="text-xs bg-white/[0.06] rounded px-1.5 py-0.5 font-mono text-[#e4e4e7]">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-white/[0.1] bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-mono text-[#a1a1aa]">
      {children}
    </kbd>
  );
}

function SectionCard({ id, icon, title, children }: { id?: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-lg border border-white/[0.06] bg-[#111113] p-5 scroll-mt-14">
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

function CollapsibleSection({ id, icon, title, children }: { id?: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section id={id} className="rounded-lg border border-white/[0.06] bg-[#111113] p-5 scroll-mt-14">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 text-left"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#5865f2]/10">
          {icon}
        </div>
        <h2 className="text-base font-bold text-[#e4e4e7] flex-1">{title}</h2>
        <ChevronDown className={`size-4 text-[#52525b] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 text-sm text-[#a1a1aa] leading-relaxed mt-4">
          {children}
        </div>
      )}
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

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-md bg-white/[0.02] border border-white/[0.04] px-4 py-3">
      <p className="text-[13px] font-semibold text-[#e4e4e7] mb-1">{q}</p>
      <p className="text-sm text-[#a1a1aa]"><Fmt text={a} /></p>
    </div>
  );
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-[#5865f2] text-white shadow-lg shadow-black/40 hover:bg-[#4752c4] transition-all animate-in fade-in duration-200"
    >
      <ArrowUp className="size-4" />
    </button>
  );
}

export default function DocsPage() {
  const { t, locale, setLocale } = useLocale();

  const toc = [
    { id: "quick-start", label: t.docs.tocQuickStart },
    { id: "classic", label: t.docs.tocClassic },
    { id: "v2", label: t.docs.tocV2 },
    { id: "ai", label: t.docs.tocAi },
    { id: "markdown", label: t.docs.tocMarkdown },
    { id: "shortcuts", label: t.docs.tocShortcuts },
    { id: "sharing", label: t.docs.tocSharing },
    { id: "json", label: t.docs.tocJson },
    { id: "webhooks", label: t.docs.tocWebhooks },
    { id: "limits", label: t.docs.tocLimits },
    { id: "faq", label: t.docs.tocFaq },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] scroll-smooth">
      <header className="sticky top-0 z-50 flex h-10 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-md px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[11px] font-medium text-[#71717a] hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3" />
          <span className="hidden sm:inline">{t.docs.backToEditor}</span>
        </Link>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <Cat className="size-4 text-[#5865f2]" />
          <span className="text-xs font-bold tracking-tight text-white">embed.cat</span>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="https://discord.gg/HvZGEYEgt5"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" /></svg>
            <span className="hidden sm:inline">Community</span>
          </a>
          <button
            onClick={() => setLocale(locale === "en" ? "ru" : "en")}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            <Globe className="size-3" />
            {locale === "en" ? "RU" : "EN"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">{t.docs.title}</h1>
          <p className="text-sm text-[#71717a]">{t.docs.subtitle}</p>
        </div>

        <div className="mb-8 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-1.5">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="shrink-0 rounded-full px-3 py-1 text-[11px] font-medium bg-white/[0.04] text-[#71717a] hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-4">

          <SectionCard id="quick-start" icon={<Zap className="size-4 text-[#5865f2]" />} title={t.docs.quickStartTitle}>
            <ol className="list-decimal list-inside space-y-2 text-[#a1a1aa]">
              <li><Fmt text={t.docs.quickStart1} /></li>
              <li><Fmt text={t.docs.quickStart2} /></li>
              <li><Fmt text={t.docs.quickStart3} /></li>
            </ol>
          </SectionCard>

          <SectionCard id="classic" icon={<Layers className="size-4 text-[#5865f2]" />} title={t.docs.classicTitle}>
            <p><Fmt text={t.docs.classicDesc} /></p>
            <p><Fmt text={t.docs.classicFields} /></p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><Fmt text={t.docs.classicFieldTitle} /></li>
              <li><Fmt text={t.docs.classicFieldDesc} /></li>
              <li><Fmt text={t.docs.classicFieldColor} /></li>
              <li><Fmt text={t.docs.classicFieldFields} /></li>
              <li><Fmt text={t.docs.classicFieldAuthor} /></li>
              <li><Fmt text={t.docs.classicFieldFooter} /></li>
              <li><Fmt text={t.docs.classicFieldImages} /></li>
              <li><Fmt text={t.docs.classicFieldTimestamp} /></li>
            </ul>
            <div className="rounded-md bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-[12px] text-[#71717a]">
              <Fmt text={t.docs.classicClickable} />
            </div>
          </SectionCard>

          <SectionCard id="v2" icon={<Box className="size-4 text-[#5865f2]" />} title={t.docs.v2Title}>
            <p><Fmt text={t.docs.v2Desc} /></p>
            <p><Fmt text={t.docs.v2Types} /></p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><Fmt text={t.docs.v2Container} /></li>
              <li><Fmt text={t.docs.v2TextDisplay} /></li>
              <li><Fmt text={t.docs.v2Section} /></li>
              <li><Fmt text={t.docs.v2Separator} /></li>
              <li><Fmt text={t.docs.v2MediaGallery} /></li>
              <li><Fmt text={t.docs.v2ActionRow} /></li>
            </ul>
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[12px] text-amber-300">
              <Fmt text={t.docs.v2Note} />
            </div>
          </SectionCard>

          <SectionCard id="ai" icon={<Bot className="size-4 text-[#5865f2]" />} title={t.docs.aiTitle}>
            <p>{t.docs.aiDesc}</p>
            <p className="font-medium text-[#e4e4e7]">{t.docs.aiCanDo}</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li>{t.docs.aiCreate}</li>
              <li>{t.docs.aiModify}</li>
              <li>{t.docs.aiAnswer}</li>
              <li>{t.docs.aiGenerate}</li>
              <li>{t.docs.aiSuggest}</li>
              <li>{t.docs.aiRestyle}</li>
              <li>{t.docs.aiEmoji}</li>
              <li><Fmt text={t.docs.aiBothModes} /></li>
            </ul>
            <p className="font-medium text-[#e4e4e7]">{t.docs.aiHow}</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li>{t.docs.aiContext}</li>
              <li><Fmt text={t.docs.aiApply} /></li>
              <li>{t.docs.aiSessions}</li>
              <li>{t.docs.aiLang}</li>
            </ul>
            <div className="rounded-md bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-[12px] text-[#71717a]">
              <Fmt text={t.docs.aiLimit} />
            </div>
          </SectionCard>

          <CollapsibleSection id="markdown" icon={<Palette className="size-4 text-[#5865f2]" />} title={t.docs.markdownTitle}>
            <p><Fmt text={t.docs.markdownDesc} /></p>
            <p className="font-medium text-[#e4e4e7]">{t.docs.markdownBasic}</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">**bold**</code> — <strong className="text-[#e4e4e7]">bold</strong></li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">*italic*</code> — <em className="text-[#e4e4e7]">italic</em></li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">~~strike~~</code> — <span className="text-[#e4e4e7] line-through">strikethrough</span></li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">`code`</code> — <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">inline code</code></li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">[text](url)</code> — hyperlink</li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]"># Heading</code>, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">## Heading</code>, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">### Heading</code></li>
            </ul>
            <p className="font-medium text-[#e4e4e7]">{t.docs.markdownQuotes}</p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"> quote"}</code> — {t.docs.markdownQuoteSingle}</li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{">>> quote"}</code> — {t.docs.markdownQuoteMulti}</li>
              <li><code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"-# small text"}</code> — <span className="text-[11px] text-[#71717a]">{t.docs.markdownSubtext}</span></li>
            </ul>
            <p className="font-medium text-[#e4e4e7]">{t.docs.markdownMentions}</p>
            <p>
              <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<@userId>"}</code> {t.docs.markdownUser}, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<@&roleId>"}</code> {t.docs.markdownRole}, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<#channelId>"}</code> {t.docs.markdownChannel}
            </p>
            <p>
              <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<:name:id>"}</code> {t.docs.markdownEmoji}, <code className="text-xs bg-white/[0.06] rounded px-1 py-0.5 font-mono text-[#e4e4e7]">{"<a:name:id>"}</code> {t.docs.markdownAnimEmoji}
            </p>
          </CollapsibleSection>

          <CollapsibleSection id="shortcuts" icon={<Keyboard className="size-4 text-[#5865f2]" />} title={t.docs.shortcutsTitle}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#a1a1aa]">{t.docs.shortcutsUndo}</span>
                <div className="flex gap-1"><Kbd>Ctrl</Kbd><span className="text-[#52525b]">+</span><Kbd>Z</Kbd></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#a1a1aa]">{t.docs.shortcutsRedo}</span>
                <div className="flex gap-1"><Kbd>Ctrl</Kbd><span className="text-[#52525b]">+</span><Kbd>Shift</Kbd><span className="text-[#52525b]">+</span><Kbd>Z</Kbd></div>
              </div>
            </div>
            <p className="text-[12px] text-[#52525b] mt-2">{t.docs.shortcutsHistory}</p>
          </CollapsibleSection>

          <SectionCard id="sharing" icon={<Share2 className="size-4 text-[#5865f2]" />} title={t.docs.sharingTitle}>
            <p className="font-medium text-[#e4e4e7]">{t.docs.shareLink}</p>
            <p><Fmt text={t.docs.shareLinkDesc} /></p>
            <p className="font-medium text-[#e4e4e7]">{t.docs.saveProfile}</p>
            <p><Fmt text={t.docs.saveProfileDesc} /></p>
          </SectionCard>

          <SectionCard id="json" icon={<MessageSquare className="size-4 text-[#5865f2]" />} title={t.docs.jsonTitle}>
            <p><Fmt text={t.docs.jsonDesc} /></p>
            <ul className="list-disc list-inside space-y-1 text-[#a1a1aa]">
              <li><Fmt text={t.docs.jsonEmbedcat} /></li>
              <li><Fmt text={t.docs.jsonNadeko} /></li>
              <li><Fmt text={t.docs.jsonDiscohook} /></li>
            </ul>
            <p><Fmt text={t.docs.jsonImport} /></p>
          </SectionCard>

          <SectionCard id="webhooks" icon={<Send className="size-4 text-[#5865f2]" />} title={t.docs.webhooksTitle}>
            <p><Fmt text={t.docs.webhooksDesc} /></p>
            <p className="font-medium text-[#e4e4e7]">{t.docs.webhooksCreate}</p>
            <ol className="list-decimal list-inside space-y-2 text-[#a1a1aa]">
              <li><Fmt text={t.docs.webhooksStep1} /></li>
              <li><Fmt text={t.docs.webhooksStep2} /></li>
              <li><Fmt text={t.docs.webhooksStep3} /></li>
              <li><Fmt text={t.docs.webhooksStep4} /></li>
            </ol>
          </SectionCard>

          <CollapsibleSection id="limits" icon={<Layers className="size-4 text-[#5865f2]" />} title={t.docs.limitsTitle}>
            <div className="text-sm">
              <LimitRow label={t.docs.limitContent} value="2,000 chars" />
              <LimitRow label={t.docs.limitEmbeds} value="10" />
              <LimitRow label={t.docs.limitTitle} value="256 chars" />
              <LimitRow label={t.docs.limitDesc} value="4,096 chars" />
              <LimitRow label={t.docs.limitFields} value="25" />
              <LimitRow label={t.docs.limitFieldName} value="256 chars" />
              <LimitRow label={t.docs.limitFieldValue} value="1,024 chars" />
              <LimitRow label={t.docs.limitAuthor} value="256 chars" />
              <LimitRow label={t.docs.limitFooter} value="2,048 chars" />
              <LimitRow label={t.docs.limitTotal} value="6,000" />
              <LimitRow label={t.docs.limitUsername} value="80 chars" />
              <LimitRow label={t.docs.limitMedia} value="10" />
            </div>
          </CollapsibleSection>

          <SectionCard id="faq" icon={<HelpCircle className="size-4 text-[#5865f2]" />} title={t.docs.faqTitle}>
            <div className="space-y-2">
              <FaqItem q={t.docs.faqNoSend} a={t.docs.faqNoSendDesc} />
              <FaqItem q={t.docs.faqNoImages} a={t.docs.faqNoImagesDesc} />
              <FaqItem q={t.docs.faqV2Broken} a={t.docs.faqV2BrokenDesc} />
            </div>
          </SectionCard>

        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-[#5865f2] hover:text-[#7983f5] transition-colors"
          >
            <ArrowLeft className="size-3" />
            {t.docs.backToEditor}
          </Link>
          <div className="text-xs text-[#71717a]">
            {t.footer.builtWith}{" "}
            <img
              src="https://em-content.zobj.net/source/apple/391/red-heart_2764-fe0f.png"
              alt="❤️"
              className="inline-block h-3.5 w-3.5 align-[-2px]"
              draggable={false}
              referrerPolicy="no-referrer"
            />{" "}
            {t.footer.by}{" "}
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

      <ScrollToTop />
    </div>
  );
}
