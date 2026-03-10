"use client";

import { useCallback } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Dict } from "@/lib/i18n/locale-context";
import { usePersistedCollapse } from "@/hooks/use-persisted-collapse";
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
  Type,
} from "lucide-react";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { useBuilderStore } from "@/store/builder-store";
import { useDragReorder } from "@/hooks/use-drag-reorder";
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

function getTypeMeta(t: Dict): Record<number, { label: string; color: string; icon: React.ReactNode }> {
  return {
    [ComponentType.Container]: {
      label: t.v2.container,
      color: "#5865f2",
      icon: <Box className="size-3" />,
    },
    [ComponentType.TextDisplay]: {
      label: t.v2.textDisplay,
      color: "#57f287",
      icon: <Type className="size-3" />,
    },
    [ComponentType.Section]: {
      label: t.v2.section,
      color: "#fee75c",
      icon: <SplitSquareHorizontal className="size-3" />,
    },
    [ComponentType.Separator]: {
      label: t.v2.separator,
      color: "#9b59b6",
      icon: <Minus className="size-3" />,
    },
    [ComponentType.ActionRow]: {
      label: t.v2.actionRow,
      color: "#eb459e",
      icon: <MousePointerClick className="size-3" />,
    },
    [ComponentType.MediaGallery]: {
      label: t.v2.mediaGallery,
      color: "#ed4245",
      icon: <ImageIcon className="size-3" />,
    },
  };
}

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
  gripProps,
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
  gripProps?: Record<string, unknown>;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
      onClick={onToggle}
    >
      <GripVertical {...gripProps} className="size-3.5 text-[#3f3f46] shrink-0 cursor-grab active:cursor-grabbing touch-none" />
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
        <ConfirmDeleteButton onConfirm={onDelete} />
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
  dragProps,
  gripProps,
}: {
  child: ContainerChild;
  index: number;
  total: number;
  containerId: string;
  dragProps?: Record<string, unknown>;
  gripProps?: Record<string, unknown>;
}) {
  const [collapsed, toggleCollapsed] = usePersistedCollapse(`v2-child-${child.id}`, false);
  const { updateComponent } = useBuilderStore();
  const { t } = useLocale();
  const TYPE_META = getTypeMeta(t);

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
    <div className="rounded-md border border-white/[0.04] bg-white/[0.02] overflow-hidden" {...dragProps}>
      <ComponentCardHeader
        type={child.type}
        label={meta.label}
        color={meta.color}
        icon={meta.icon}
        index={index}
        total={total}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        onMoveUp={() => moveChild("up")}
        onMoveDown={() => moveChild("down")}
        onDelete={removeChild}
        gripProps={gripProps}
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
  const { t } = useLocale();

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
          <span>{t.v2.addChildComponent}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="border-white/[0.08] bg-[#111113]">
        <SelectItem value="text" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Type className="size-3 text-[#57f287]" />
            {t.v2.textDisplay}
          </span>
        </SelectItem>
        <SelectItem value="section" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <SplitSquareHorizontal className="size-3 text-[#fee75c]" />
            {t.v2.section}
          </span>
        </SelectItem>
        <SelectItem value="separator" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Minus className="size-3 text-[#9b59b6]" />
            {t.v2.separator}
          </span>
        </SelectItem>
        <SelectItem value="actionrow" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <MousePointerClick className="size-3 text-[#eb459e]" />
            {t.v2.actionRow}
          </span>
        </SelectItem>
        <SelectItem value="mediagallery" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <ImageIcon className="size-3 text-[#ed4245]" />
            {t.v2.mediaGallery}
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
  const { t } = useLocale();
  const reorderChildren = useCallback(
    (from: number, to: number) => {
      onChange((c) => {
        if (c.type !== ComponentType.Container) return c;
        const children = [...c.components];
        const [moved] = children.splice(from, 1);
        children.splice(to, 0, moved);
        return { ...c, components: children };
      });
    },
    [onChange]
  );

  const { getDragProps: getChildDragProps, getGripProps: getChildGripProps, getContainerProps: getChildContainerProps } =
    useDragReorder(reorderChildren);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-[0.08em]">
            {t.v2.accentColor}
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
            {t.v2.spoiler}
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#71717a] flex items-center gap-1.5">
            <Layers className="size-3" />
            {t.v2.children}
            <Badge
              variant="secondary"
              className="bg-[#18181b] text-[#71717a] text-[10px] h-4 border-0"
            >
              {component.components.length}
            </Badge>
          </span>
        </div>
        <div className="space-y-1.5" {...getChildContainerProps()}>
          {component.components.map((child, i) => (
            <ContainerChildCard
              key={child.id}
              child={child}
              index={i}
              total={component.components.length}
              containerId={component.id}
              dragProps={getChildDragProps(i)}
              gripProps={getChildGripProps(i)}
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
  dragProps,
  gripProps,
}: {
  component: TopLevelComponent;
  index: number;
  total: number;
  dragProps: Record<string, unknown>;
  gripProps: Record<string, unknown>;
}) {
  const [collapsed, toggleCollapsed] = usePersistedCollapse(`v2-${component.id}`, false);
  const { removeComponent, moveComponent, updateComponent } =
    useBuilderStore();
  const { t } = useLocale();
  const TYPE_META = getTypeMeta(t);

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
    <div className="rounded-lg bg-[#111113] border border-white/[0.06] overflow-hidden" {...dragProps}>
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
        onToggle={toggleCollapsed}
        onMoveUp={() => moveComponent(component.id, "up")}
        onMoveDown={() => moveComponent(component.id, "down")}
        onDelete={() => removeComponent(component.id)}
        gripProps={gripProps}
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
  const { t } = useLocale();

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
          <span>{t.v2.addComponent}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="border-white/[0.08] bg-[#111113]">
        <SelectItem value="container" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Box className="size-3 text-[#5865f2]" />
            {t.v2.container}
          </span>
        </SelectItem>
        <SelectItem value="text" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Type className="size-3 text-[#57f287]" />
            {t.v2.textDisplay}
          </span>
        </SelectItem>
        <SelectItem value="section" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <SplitSquareHorizontal className="size-3 text-[#fee75c]" />
            {t.v2.section}
          </span>
        </SelectItem>
        <SelectItem value="separator" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <Minus className="size-3 text-[#9b59b6]" />
            {t.v2.separator}
          </span>
        </SelectItem>
        <SelectItem value="actionrow" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <MousePointerClick className="size-3 text-[#eb459e]" />
            {t.v2.actionRow}
          </span>
        </SelectItem>
        <SelectItem value="mediagallery" className="text-[#e4e4e7] text-xs">
          <span className="flex items-center gap-2">
            <ImageIcon className="size-3 text-[#ed4245]" />
            {t.v2.mediaGallery}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ComponentsV2Editor() {
  const components = useBuilderStore((s) => s.components);
  const reorderComponents = useBuilderStore((s) => s.reorderComponents);
  const { t } = useLocale();
  const { getDragProps, getGripProps, getContainerProps } = useDragReorder(useCallback((from: number, to: number) => reorderComponents(from, to), [reorderComponents]));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <Label className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#a1a1aa]">
          {t.v2.components}
        </Label>
        <span className="text-[11px] tabular-nums font-mono text-[#3f3f46]">
          {components.length}/{LIMITS.COMPONENTS_MAX}
        </span>
      </div>

      <div className="space-y-2" {...getContainerProps()}>
        {components.map((comp, i) => (
          <TopLevelCard
            key={comp.id}
            component={comp}
            index={i}
            total={components.length}
            dragProps={getDragProps(i)}
            gripProps={getGripProps(i)}
          />
        ))}
      </div>

      {components.length < LIMITS.COMPONENTS_MAX && <AddTopLevelButton />}
    </div>
  );
}
