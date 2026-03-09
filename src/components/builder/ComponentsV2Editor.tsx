"use client";

import { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import {
  ArrowUp,
  ArrowDown,
  Box,
  ChevronDown,
  GripVertical,
  ImageIcon,
  Layers,
  Minus,
  MousePointerClick,
  Plus,
  SplitSquareHorizontal,
  Trash2,
  Type,
} from "lucide-react";
import { useBuilderStore } from "@/store/builder-store";
import {
  createContainer,
  createTextDisplay,
  createSection,
  createSeparator,
  createActionRow,
  createMediaGallery,
  createButton,
  createThumbnail,
  createMediaGalleryItem,
} from "@/store/builder-store";
import {
  ComponentType,
  LIMITS,
  type TopLevelComponent,
  type ContainerComponent,
  type ContainerChild,
  type TextDisplayComponent,
  type SectionComponent,
  type SeparatorComponent,
  type ActionRowComponent,
  type MediaGalleryComponent,
} from "@/types/discord";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextDisplayEditor } from "./v2/TextDisplayEditor";
import { SectionEditor } from "./v2/SectionEditor";
import { SeparatorEditor } from "./v2/SeparatorEditor";
import { ActionRowEditor } from "./v2/ActionRowEditor";
import { MediaGalleryEditor } from "./v2/MediaGalleryEditor";

const TYPE_META: Record<
  number,
  { label: string; color: string; icon: React.ReactNode }
> = {
  [ComponentType.Container]: {
    label: "Container",
    color: "#5865f2",
    icon: <Box className="size-3" />,
  },
  [ComponentType.TextDisplay]: {
    label: "Text Display",
    color: "#57f287",
    icon: <Type className="size-3" />,
  },
  [ComponentType.Section]: {
    label: "Section",
    color: "#fee75c",
    icon: <SplitSquareHorizontal className="size-3" />,
  },
  [ComponentType.Separator]: {
    label: "Separator",
    color: "#9b59b6",
    icon: <Minus className="size-3" />,
  },
  [ComponentType.ActionRow]: {
    label: "Action Row",
    color: "#eb459e",
    icon: <MousePointerClick className="size-3" />,
  },
  [ComponentType.MediaGallery]: {
    label: "Media Gallery",
    color: "#ed4245",
    icon: <ImageIcon className="size-3" />,
  },
};

function intToHex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}


function ComponentCardHeader({
  type,
  label,
  color,
  icon,
  index,
  total,
  collapsed,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  type: number;
  label: string;
  color: string;
  icon: React.ReactNode;
  index: number;
  total: number;
  collapsed: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
      onClick={onToggle}
    >
      <GripVertical className="size-3.5 text-[#3f3f46] shrink-0" />
      <Badge
        variant="secondary"
        className="shrink-0 text-[10px] px-1.5 h-[18px] gap-1 border-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
        {label}
      </Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={index === 0}
          className="text-[#52525b] hover:text-[#a1a1aa] transition-colors"
        >
          <ArrowUp className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={index === total - 1}
          className="text-[#52525b] hover:text-[#a1a1aa] transition-colors"
        >
          <ArrowDown className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-[#52525b] hover:text-red-400 transition-colors"
        >
          <Trash2 className="size-3" />
        </Button>
        <ChevronDown
          className={`size-3.5 text-[#52525b] ml-1 transition-transform duration-200 ${
            collapsed ? "" : "rotate-180"
          }`}
        />
      </div>
    </div>
  );
}


function ContainerChildCard({
  child,
  index,
  total,
  containerId,
}: {
  child: ContainerChild;
  index: number;
  total: number;
  containerId: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { updateComponent } = useBuilderStore();

  const meta = TYPE_META[child.type] ?? {
    label: "Unknown",
    color: "#888",
    icon: <Box className="size-3" />,
  };

  const moveChild = (direction: "up" | "down") => {
    updateComponent(containerId, (c) => {
      if (c.type !== ComponentType.Container) return c;
      const children = [...c.components];
      const newIdx = direction === "up" ? index - 1 : index + 1;
      if (newIdx < 0 || newIdx >= children.length) return c;
      [children[index], children[newIdx]] = [children[newIdx], children[index]];
      return { ...c, components: children };
    });
  };

  const removeChild = () => {
    updateComponent(containerId, (c) => {
      if (c.type !== ComponentType.Container) return c;
      return { ...c, components: c.components.filter((_, i) => i !== index) };
    });
  };

  const updateChild = (updates: Partial<ContainerChild>) => {
    updateComponent(containerId, (c) => {
      if (c.type !== ComponentType.Container) return c;
      return {
        ...c,
        components: c.components.map((ch, i) =>
          i === index ? ({ ...ch, ...updates } as ContainerChild) : ch
        ),
      };
    });
  };

  return (
    <div className="rounded-md border border-white/[0.04] bg-white/[0.02] overflow-hidden">
      <ComponentCardHeader
        type={child.type}
        label={meta.label}
        color={meta.color}
        icon={meta.icon}
        index={index}
        total={total}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        onMoveUp={() => moveChild("up")}
        onMoveDown={() => moveChild("down")}
        onDelete={removeChild}
      />
      {!collapsed && (
        <div className="px-3 pb-2 pt-1">
          <ChildEditor child={child} onChange={updateChild} />
        </div>
      )}
    </div>
  );
}

function ChildEditor({
  child,
  onChange,
}: {
  child: ContainerChild;
  onChange: (updates: Partial<ContainerChild>) => void;
}) {
  switch (child.type) {
    case ComponentType.TextDisplay:
      return (
        <TextDisplayEditor
          component={child}
          onChange={onChange as (u: Partial<TextDisplayComponent>) => void}
        />
      );
    case ComponentType.Section:
      return (
        <SectionEditor
          component={child}
          onChange={onChange as (u: Partial<SectionComponent>) => void}
        />
      );
    case ComponentType.Separator:
      return (
        <SeparatorEditor
          component={child}
          onChange={onChange as (u: Partial<SeparatorComponent>) => void}
        />
      );
    case ComponentType.ActionRow:
      return (
        <ActionRowEditor
          component={child}
          onChange={onChange as (u: Partial<ActionRowComponent>) => void}
        />
      );
    case ComponentType.MediaGallery:
      return (
        <MediaGalleryEditor
          component={child}
          onChange={onChange as (u: Partial<MediaGalleryComponent>) => void}
        />
      );
    default:
      return null;
  }
}

function AddChildButton({
  containerId,
}: {
  containerId: string;
}) {
  const { updateComponent } = useBuilderStore();

  const addChild = (type: string | null) => {
    if (!type) return;
    const factories: Record<string, () => ContainerChild> = {
      text: createTextDisplay,
      section: createSection,
      separator: createSeparator,
      actionrow: createActionRow,
      mediagallery: createMediaGallery,
    };
    const factory = factories[type];
    if (!factory) return;
    updateComponent(containerId, (c) => {
      if (c.type !== ComponentType.Container) return c;
      return { ...c, components: [...c.components, factory()] };
    });
  };

  return (
    <Select value="" onValueChange={addChild}>
      <SelectTrigger className="w-full h-8 border-dashed border-white/[0.08] bg-transparent text-[#71717a] hover:text-[#a1a1aa] hover:border-white/[0.12] text-xs transition-colors">
        <div className="flex items-center gap-1.5">
          <Plus className="size-3" />
          <span>Add Child Component</span>
        </div>
      </SelectTrigger>
      <SelectContent className="border-white/[0.08] bg-[#111113]">
        <SelectItem value="text" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Type className="size-3 text-[#57f287]" />
            Text Display
          </span>
        </SelectItem>
        <SelectItem value="section" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <SplitSquareHorizontal className="size-3 text-[#fee75c]" />
            Section
          </span>
        </SelectItem>
        <SelectItem value="separator" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Minus className="size-3 text-[#9b59b6]" />
            Separator
          </span>
        </SelectItem>
        <SelectItem value="actionrow" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <MousePointerClick className="size-3 text-[#eb459e]" />
            Action Row
          </span>
        </SelectItem>
        <SelectItem value="mediagallery" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <ImageIcon className="size-3 text-[#ed4245]" />
            Media Gallery
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function ContainerEditor({
  component,
  onChange,
}: {
  component: ContainerComponent;
  onChange: (updater: (c: TopLevelComponent) => TopLevelComponent) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#52525b] uppercase tracking-[0.08em]">
            Accent Color
          </Label>
          <ColorPicker
            color={component.accent_color ?? 0x5865f2}
            onChange={(color) =>
              onChange((c) => {
                if (c.type !== ComponentType.Container) return c;
                return { ...c, accent_color: color };
              })
            }
          />
        </div>
        <div className="flex items-center gap-2.5 pt-4">
          <Switch
            checked={component.spoiler ?? false}
            onCheckedChange={(val) =>
              onChange((c) => {
                if (c.type !== ComponentType.Container) return c;
                return { ...c, spoiler: val };
              })
            }
            className="data-checked:bg-[#5865f2]"
            size="sm"
          />
          <Label className="text-xs text-[#71717a] cursor-pointer">
            Spoiler
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#71717a] flex items-center gap-1.5">
            <Layers className="size-3" />
            Children
            <Badge
              variant="secondary"
              className="bg-[#18181b] text-[#71717a] text-[10px] h-4 border-0"
            >
              {component.components.length}
            </Badge>
          </span>
        </div>
        <div className="space-y-1.5">
          {component.components.map((child, i) => (
            <ContainerChildCard
              key={child.id}
              child={child}
              index={i}
              total={component.components.length}
              containerId={component.id}
            />
          ))}
        </div>
        <AddChildButton containerId={component.id} />
      </div>
    </div>
  );
}

function TopLevelCard({
  component,
  index,
  total,
}: {
  component: TopLevelComponent;
  index: number;
  total: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { removeComponent, moveComponent, updateComponent } =
    useBuilderStore();

  const meta = TYPE_META[component.type] ?? {
    label: "Unknown",
    color: "#888",
    icon: <Box className="size-3" />,
  };

  const accentColor =
    component.type === ComponentType.Container
      ? intToHex(component.accent_color ?? 0x5865f2)
      : undefined;

  const onChange = (updates: Partial<TopLevelComponent>) => {
    updateComponent(component.id, (c) => ({ ...c, ...updates }) as TopLevelComponent);
  };

  return (
    <div className="rounded-lg bg-[#111113] border border-white/[0.06] overflow-hidden">
      {accentColor && (
        <div
          className="h-1 w-full"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <ComponentCardHeader
        type={component.type}
        label={meta.label}
        color={meta.color}
        icon={meta.icon}
        index={index}
        total={total}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        onMoveUp={() => moveComponent(component.id, "up")}
        onMoveDown={() => moveComponent(component.id, "down")}
        onDelete={() => removeComponent(component.id)}
      />
      {!collapsed && (
        <div className="px-3 pb-2 pt-1 border-t border-white/[0.06]">
          {component.type === ComponentType.Container ? (
            <ContainerEditor
              component={component}
              onChange={(updater) => updateComponent(component.id, updater)}
            />
          ) : (
            <ChildEditor
              child={component as ContainerChild}
              onChange={(updates) =>
                updateComponent(component.id, (c) => ({
                  ...c,
                  ...updates,
                }) as TopLevelComponent)
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function AddTopLevelButton() {
  const { addComponent } = useBuilderStore();

  const addTopLevel = (type: string | null) => {
    if (!type) return;
    const factories: Record<string, () => TopLevelComponent> = {
      container: createContainer,
      text: createTextDisplay,
      section: createSection,
      separator: createSeparator,
      actionrow: createActionRow,
      mediagallery: createMediaGallery,
    };
    const factory = factories[type];
    if (!factory) return;
    addComponent(factory());
  };

  return (
    <Select value="" onValueChange={addTopLevel}>
      <SelectTrigger className="w-full h-9 border-dashed border-white/[0.08] bg-transparent text-[#71717a] hover:text-[#5865f2] hover:border-[#5865f2]/40 transition-colors text-sm">
        <div className="flex items-center gap-1.5">
          <Plus className="size-3.5" />
          <span>Add Component</span>
        </div>
      </SelectTrigger>
      <SelectContent className="border-white/[0.08] bg-[#111113]">
        <SelectItem value="container" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Box className="size-3 text-[#5865f2]" />
            Container
          </span>
        </SelectItem>
        <SelectItem value="text" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Type className="size-3 text-[#57f287]" />
            Text Display
          </span>
        </SelectItem>
        <SelectItem value="section" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <SplitSquareHorizontal className="size-3 text-[#fee75c]" />
            Section
          </span>
        </SelectItem>
        <SelectItem value="separator" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Minus className="size-3 text-[#9b59b6]" />
            Separator
          </span>
        </SelectItem>
        <SelectItem value="actionrow" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <MousePointerClick className="size-3 text-[#eb459e]" />
            Action Row
          </span>
        </SelectItem>
        <SelectItem value="mediagallery" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <ImageIcon className="size-3 text-[#ed4245]" />
            Media Gallery
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ComponentsV2Editor() {
  const components = useBuilderStore((s) => s.components);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <Label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#52525b]">
          Components
        </Label>
        <span className="text-[11px] tabular-nums font-mono text-[#3f3f46]">
          {components.length}/{LIMITS.COMPONENTS_MAX}
        </span>
      </div>

      <div className="space-y-2">
        {components.map((comp, i) => (
          <TopLevelCard
            key={comp.id}
            component={comp}
            index={i}
            total={components.length}
          />
        ))}
      </div>

      {components.length < LIMITS.COMPONENTS_MAX && <AddTopLevelButton />}
    </div>
  );
}
