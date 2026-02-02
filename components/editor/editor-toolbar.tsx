"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconCheck, IconLoader, IconX } from "@/components/ui/icons";

/* ---------- Preview Modal ---------- */

function PreviewModal({
  html,
  title,
  onClose,
}: {
  html: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 flex h-[85vh] w-full max-w-3xl flex-col rounded-lg border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b px-6 py-3">
          <h2 className="text-lg font-semibold">Preview</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <IconX className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <article className="prose prose-sm dark:prose-invert max-w-none">
            {title && <h1>{title}</h1>}
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </article>
        </div>
      </div>
    </div>
  );
}

/* ---------- Publish Modal ---------- */

function PublishModal({
  title,
  onClose,
  onPublish,
}: {
  title: string;
  onClose: () => void;
  onPublish: (method: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader>
          <CardTitle>Publish Article</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose how to publish &ldquo;{title || "Untitled"}&rdquo;
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent/50"
            onClick={() => onPublish("wordpress")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 19.5c-5.247 0-9.5-4.253-9.5-9.5S6.753 2.5 12 2.5s9.5 4.253 9.5 9.5-4.253 9.5-9.5 9.5z" />
                <path d="M3.009 12L7.262 21.1 3.009 12zM12 3.009l-3.573 10.74h7.146L12 3.009zM16.738 21.1L20.991 12 16.738 21.1z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">WordPress</p>
              <p className="text-xs text-muted-foreground">
                Push directly to your WordPress site
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto text-[10px]">
              Coming Soon
            </Badge>
          </button>

          <button
            className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent/50"
            onClick={() => onPublish("html")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Download HTML</p>
              <p className="text-xs text-muted-foreground">
                Save as a standalone HTML file
              </p>
            </div>
          </button>

          <button
            className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent/50"
            onClick={() => onPublish("markdown")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <span className="text-sm font-bold text-primary">MD</span>
            </div>
            <div>
              <p className="text-sm font-medium">Download Markdown</p>
              <p className="text-xs text-muted-foreground">
                Save as a Markdown file
              </p>
            </div>
          </button>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="ml-auto" onClick={onClose}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ---------- Top Toolbar ---------- */

interface EditorTopToolbarProps {
  title: string;
  contentHtml: string;
  contentMarkdown: string | null;
  status: string;
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onPublish: (method: string) => void;
}

export function EditorTopToolbar({
  title,
  contentHtml,
  contentMarkdown,
  status,
  isSaving,
  lastSaved,
  onSave,
  onPublish,
}: EditorTopToolbarProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  function handlePublish(method: string) {
    if (method === "html") {
      const blob = new Blob(
        [
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || "Article"}</title></head><body>${contentHtml}</body></html>`,
        ],
        { type: "text/html" }
      );
      downloadBlob(blob, `${slugify(title || "article")}.html`);
    } else if (method === "markdown") {
      const content = contentMarkdown ?? contentHtml;
      const blob = new Blob([content], { type: "text/markdown" });
      downloadBlob(blob, `${slugify(title || "article")}.md`);
    }
    // WordPress: no-op for now
    setShowPublish(false);
    onPublish(method);
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconLoader className="h-3 w-3" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconCheck className="h-3 w-3 text-success" />
                Saved{" "}
                {lastSaved.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : null}
            <Badge
              variant={
                status === "READY"
                  ? "success"
                  : status === "PUBLISHED"
                    ? "default"
                    : "secondary"
              }
              className="text-[10px]"
            >
              {status}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(true)}
        >
          Preview
        </Button>
        <Button size="sm" onClick={() => setShowPublish(true)}>
          Publish
        </Button>
      </div>

      {showPreview && (
        <PreviewModal
          html={contentHtml}
          title={title}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showPublish && (
        <PublishModal
          title={title}
          onClose={() => setShowPublish(false)}
          onPublish={handlePublish}
        />
      )}
    </>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
