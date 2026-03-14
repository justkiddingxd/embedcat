"use client";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { useLocale } from "@/lib/i18n/locale-context";
import { useBuilderStore, type ActionItem } from "@/store/builder-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/dropdown";
import {
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Circle,
  Clock,
  UserPlus,
  UserMinus,
  ToggleLeft,
  MessageSquare,
  Webhook,
  MessageCirclePlus,
  Trash2,
  StopCircle,
  Variable,
  type LucideIcon,
} from "lucide-react";

const ACTION_TYPES = [
  "do_nothing",
  "wait",
  "add_role",
  "remove_role",
  "toggle_role",
  "send_message",
  "send_webhook",
  "create_thread",
  "set_variable",
  "delete_message",
  "stop",
] as const;

type ActionType = (typeof ACTION_TYPES)[number];

const ACTION_ICONS: Record<ActionType, LucideIcon> = {
  do_nothing: Circle,
  wait: Clock,
  add_role: UserPlus,
  remove_role: UserMinus,
  toggle_role: ToggleLeft,
  send_message: MessageSquare,
  send_webhook: Webhook,
  create_thread: MessageCirclePlus,
  set_variable: Variable,
  delete_message: Trash2,
  stop: StopCircle,
};

const ACTION_COLORS: Record<ActionType, string> = {
  do_nothing: "#71717a",
  wait: "#f59e0b",
  add_role: "#22c55e",
  remove_role: "#ef4444",
  toggle_role: "#8b5cf6",
  send_message: "#3b82f6",
  send_webhook: "#6366f1",
  create_thread: "#06b6d4",
  set_variable: "#f97316",
  delete_message: "#dc2626",
  stop: "#52525b",
};

interface ActionChainEditorProps {
  buttonId: string;
}

const EMPTY_ACTIONS: ActionItem[] = [];

export function ActionChainEditor({ buttonId }: ActionChainEditorProps) {
  const { t } = useLocale();
  const actions = useBuilderStore((s) => s.buttonActions[buttonId]?.actions) ?? EMPTY_ACTIONS;
  const addButtonAction = useBuilderStore((s) => s.addButtonAction);
  const removeButtonAction = useBuilderStore((s) => s.removeButtonAction);
  const updateButtonAction = useBuilderStore((s) => s.updateButtonAction);
  const reorderButtonActions = useBuilderStore((s) => s.reorderButtonActions);

  const handleAddAction = (type: string | null) => {
    if (!type) return;
    const action: ActionItem = {
      id: nanoid(),
      type,
      config: type === "wait" ? { seconds: 3 } : {},
    };
    addButtonAction(buttonId, action);
  };

  return (
    <div className="space-y-2 mt-2 pt-2 border-t border-white/[0.06]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-[0.08em]">
          {t.actions.title}
        </span>
        <Badge
          variant="secondary"
          className="bg-[#18181b] text-[#71717a] text-[10px] h-4 border-0"
        >
          {actions.length}
        </Badge>
      </div>

      {actions.length === 0 && (
        <p className="text-[11px] text-[#52525b] py-2">{t.actions.emptyState}</p>
      )}

      <div className="space-y-1">
        {actions.map((action, idx) => (
          <ActionCard
            key={action.id}
            action={action}
            index={idx}
            total={actions.length}
            onUpdate={(updates) => updateButtonAction(buttonId, action.id, updates)}
            onRemove={() => removeButtonAction(buttonId, action.id)}
            onMoveUp={() => idx > 0 && reorderButtonActions(buttonId, idx, idx - 1)}
            onMoveDown={() => idx < actions.length - 1 && reorderButtonActions(buttonId, idx, idx + 1)}
          />
        ))}
      </div>

      <Dropdown value="" onValueChange={handleAddAction}>
        <DropdownTrigger size="sm" className="border-dashed border-white/[0.08] bg-transparent text-[#71717a] hover:text-[#a1a1aa] hover:border-white/[0.12] hover:bg-transparent">
          <Plus className="size-3" />
          <span>{t.actions.addAction}</span>
        </DropdownTrigger>
        <DropdownContent>
          {ACTION_TYPES.map((type) => {
            const Icon = ACTION_ICONS[type];
            const label = t.actions[type as keyof typeof t.actions] as string;
            return (
              <DropdownItem key={type} value={type}>
                <span className="flex items-center gap-2">
                  <Icon className="size-3" style={{ color: ACTION_COLORS[type] }} />
                  {label}
                </span>
              </DropdownItem>
            );
          })}
        </DropdownContent>
      </Dropdown>
    </div>
  );
}

function ActionCard({
  action,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  action: ActionItem;
  index: number;
  total: number;
  onUpdate: (updates: Partial<ActionItem>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { t } = useLocale();
  const type = action.type as ActionType;
  const Icon = ACTION_ICONS[type] ?? Circle;
  const color = ACTION_COLORS[type] ?? "#71717a";
  const label = (t.actions[type as keyof typeof t.actions] as string) ?? type;

  const updateConfig = (key: string, value: unknown) => {
    onUpdate({ config: { ...action.config, [key]: value } });
  };

  return (
    <div className="rounded-md border border-white/[0.04] bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Icon className="size-3 shrink-0" style={{ color }} />
        <span className="text-[11px] font-medium text-[#e4e4e7] flex-1">{label}</span>
        <span className="text-[10px] text-[#3f3f46] tabular-nums">{index + 1}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-[#52525b] hover:text-[#a1a1aa] size-5"
        >
          <ArrowUp className="size-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-[#52525b] hover:text-[#a1a1aa] size-5"
        >
          <ArrowDown className="size-2.5" />
        </Button>
        <button
          onClick={onRemove}
          className="p-0.5 rounded text-[#52525b] hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <X className="size-3" />
        </button>
      </div>

      <ActionConfigFields type={type} config={action.config} onChange={updateConfig} />
    </div>
  );
}

function ActionConfigFields({
  type,
  config,
  onChange,
}: {
  type: ActionType;
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const { t } = useLocale();
  const inputClass = "h-6 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-[11px] placeholder:text-[#3f3f46]";

  switch (type) {
    case "wait":
      return (
        <div className="px-2 pb-1.5">
          <ConfigLabel text={t.actions.seconds} />
          <Input
            type="number"
            min={1}
            max={300}
            value={(config.seconds as number) ?? 3}
            onChange={(e) => onChange("seconds", Number(e.target.value) || 1)}
            className={inputClass}
          />
        </div>
      );

    case "add_role":
    case "remove_role":
    case "toggle_role":
      return (
        <div className="px-2 pb-1.5">
          <ConfigLabel text={t.actions.roleId} />
          <Input
            value={(config.roleId as string) ?? ""}
            onChange={(e) => onChange("roleId", e.target.value)}
            placeholder="123456789012345678"
            className={inputClass}
          />
        </div>
      );

    case "send_message":
      return (
        <div className="px-2 pb-1.5 space-y-1">
          <ConfigLabel text={t.actions.channelId} />
          <Input
            value={(config.channelId as string) ?? ""}
            onChange={(e) => onChange("channelId", e.target.value)}
            placeholder="123456789012345678"
            className={inputClass}
          />
          <ConfigLabel text={t.actions.content} />
          <Input
            value={(config.content as string) ?? ""}
            onChange={(e) => onChange("content", e.target.value)}
            placeholder="Hello!"
            className={inputClass}
          />
          <ConfigLabel text={t.actions.embedId} />
          <SavedEmbedPicker
            value={(config.embedId as string) ?? ""}
            onChange={(val) => onChange("embedId", val)}
          />
          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={config.ephemeral !== false}
              onCheckedChange={(val) => onChange("ephemeral", val)}
              className="data-checked:bg-[#5865f2]"
              size="sm"
            />
            <Label className="text-[10px] text-[#71717a] cursor-pointer">
              {t.actions.ephemeral}
            </Label>
          </div>
        </div>
      );

    case "send_webhook":
      return (
        <div className="px-2 pb-1.5">
          <ConfigLabel text={t.actions.webhookUrl} />
          <Input
            value={(config.webhookUrl as string) ?? ""}
            onChange={(e) => onChange("webhookUrl", e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className={inputClass}
          />
        </div>
      );

    case "create_thread":
      return (
        <div className="px-2 pb-1.5">
          <ConfigLabel text={t.actions.threadName} />
          <Input
            value={(config.name as string) ?? ""}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="New Thread"
            className={inputClass}
          />
        </div>
      );

    case "set_variable":
      return (
        <div className="px-2 pb-1.5 space-y-1">
          <ConfigLabel text={t.actions.variableName} />
          <Input
            value={(config.name as string) ?? ""}
            onChange={(e) => onChange("name", e.target.value)}
            className={inputClass}
          />
          <ConfigLabel text={t.actions.variableValue} />
          <Input
            value={(config.value as string) ?? ""}
            onChange={(e) => onChange("value", e.target.value)}
            className={inputClass}
          />
        </div>
      );

    case "do_nothing":
    case "delete_message":
    case "stop":
      return null;

    default:
      return null;
  }
}

function ConfigLabel({ text }: { text: string }) {
  return (
    <label className="text-[10px] font-medium text-[#52525b]">{text}</label>
  );
}

interface SavedEmbed {
  id: string;
  title: string;
  mode: string;
}

function SavedEmbedPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const { t } = useLocale();
  const [embeds, setEmbeds] = useState<SavedEmbed[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    setLoading(true);
    fetch("/api/embeds")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SavedEmbed[]) => {
        setEmbeds(data);
        setLoaded(true);
      })
      .catch(() => setEmbeds([]))
      .finally(() => setLoading(false));
  }, [loaded]);

  if (loading) {
    return (
      <div className="h-6 flex items-center text-[10px] text-[#52525b]">
        {t.actions.loadingEmbeds ?? "Loading..."}
      </div>
    );
  }

  if (embeds.length === 0) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="embed id"
        className="h-6 border-white/[0.06] bg-[#0a0a0b] text-[#e4e4e7] text-[11px] placeholder:text-[#3f3f46]"
      />
    );
  }

  return (
    <Dropdown value={value} onValueChange={(v) => onChange(!v || v === "__none__" ? "" : v)}>
      <DropdownTrigger size="sm" className="h-6 text-[11px]">
        <span className="truncate">
          {value
            ? embeds.find((e) => e.id === value)?.title || value
            : (t.actions.selectEmbed ?? "Select embed...")}
        </span>
      </DropdownTrigger>
      <DropdownContent className="max-h-48">
        <DropdownItem value="__none__" className="text-[#71717a]">
          {t.actions.noEmbed ?? "None"}
        </DropdownItem>
        {embeds.map((e) => (
          <DropdownItem key={e.id} value={e.id}>
            <span className="flex items-center gap-2">
              <span className="truncate">{e.title || "Untitled"}</span>
              <span className="text-[10px] text-[#52525b] shrink-0">{e.id}</span>
            </span>
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
