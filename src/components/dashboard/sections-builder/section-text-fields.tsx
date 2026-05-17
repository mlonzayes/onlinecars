"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SECTION_TEXT_LIMITS, type SectionType } from "@/lib/constants";

interface SectionTextFieldsProps {
  type: SectionType;
  title: string;
  subtitle: string;
  content: string;
  onTitleChange: (next: string) => void;
  onSubtitleChange: (next: string) => void;
  onContentChange: (next: string) => void;
}

// Qué campos textuales muestra cada tipo.
const HAS_CONTENT: Record<SectionType, boolean> = {
  hero: false,
  about: true,
  catalog: false,
  gallery: false,
  financing: true,
  reviews: false,
  contact: true,
};

export function SectionTextFields({
  type,
  title,
  subtitle,
  content,
  onTitleChange,
  onSubtitleChange,
  onContentChange,
}: SectionTextFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="section-title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="section-title"
          value={title}
          maxLength={SECTION_TEXT_LIMITS.titleMax}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          {title.length} / {SECTION_TEXT_LIMITS.titleMax}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="section-subtitle">Subtítulo</Label>
        <Input
          id="section-subtitle"
          value={subtitle}
          maxLength={SECTION_TEXT_LIMITS.subtitleMax}
          onChange={(e) => onSubtitleChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {subtitle.length} / {SECTION_TEXT_LIMITS.subtitleMax}
        </p>
      </div>

      {HAS_CONTENT[type] && (
        <div className="space-y-2">
          <Label htmlFor="section-content">Texto</Label>
          <Textarea
            id="section-content"
            value={content}
            maxLength={SECTION_TEXT_LIMITS.contentMax}
            onChange={(e) => onContentChange(e.target.value)}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            {content.length} / {SECTION_TEXT_LIMITS.contentMax}
          </p>
        </div>
      )}
    </div>
  );
}
