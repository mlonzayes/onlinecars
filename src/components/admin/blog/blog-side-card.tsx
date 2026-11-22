"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BlogCoverField } from "./blog-cover-field";
import type { BlogFieldProps } from "./blog-editor-types";

const AUTHOR_TYPE_LABELS = { Person: "Persona", Organization: "Empresa / estudio" } as const;

/** Portada y autor. El autor va al JSON-LD (Person u Organization). */
export function BlogSideCard({ values, onChange }: BlogFieldProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Portada y autor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BlogCoverField values={values} onChange={onChange} />

        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="blog-author">Autor *</Label>
            <Input id="blog-author" value={values.authorName} onChange={(e) => onChange({ authorName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="blog-initials">Iniciales *</Label>
            <Input
              id="blog-initials"
              value={values.authorInitials}
              maxLength={3}
              onChange={(e) => onChange({ authorInitials: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Tipo de autor</Label>
          <Select
            value={values.authorType}
            onValueChange={(v) => (v === "Person" || v === "Organization") && onChange({ authorType: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{(v) => AUTHOR_TYPE_LABELS[v as keyof typeof AUTHOR_TYPE_LABELS]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Person">Persona</SelectItem>
              <SelectItem value="Organization">Empresa / estudio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="blog-author-url">Web del autor</Label>
          <Input
            id="blog-author-url"
            type="url"
            placeholder="https://"
            value={values.authorUrl ?? ""}
            onChange={(e) => onChange({ authorUrl: e.target.value.trim() || null })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
