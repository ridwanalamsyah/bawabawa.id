import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export interface RichTextEditorProps {
  /** Tiptap JSON document. Pass `{}` (or `null`/empty) for an empty doc. */
  value: Record<string, unknown> | null | undefined;
  onChange: (json: Record<string, unknown>) => void;
  placeholder?: string;
  /** ARIA label for the editor region. */
  ariaLabel?: string;
}

const TOOLBAR: { label: string; key: string; action: (e: Editor) => void; isActive: (e: Editor) => boolean }[] = [
  { label: "B", key: "bold", action: (e) => e.chain().focus().toggleBold().run(), isActive: (e) => e.isActive("bold") },
  { label: "I", key: "italic", action: (e) => e.chain().focus().toggleItalic().run(), isActive: (e) => e.isActive("italic") },
  { label: "S", key: "strike", action: (e) => e.chain().focus().toggleStrike().run(), isActive: (e) => e.isActive("strike") },
  { label: "H1", key: "h1", action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e) => e.isActive("heading", { level: 1 }) },
  { label: "H2", key: "h2", action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e) => e.isActive("heading", { level: 2 }) },
  { label: "H3", key: "h3", action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e) => e.isActive("heading", { level: 3 }) },
  { label: "• List", key: "ul", action: (e) => e.chain().focus().toggleBulletList().run(), isActive: (e) => e.isActive("bulletList") },
  { label: "1. List", key: "ol", action: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive("orderedList") },
  { label: "❝ Quote", key: "quote", action: (e) => e.chain().focus().toggleBlockquote().run(), isActive: (e) => e.isActive("blockquote") },
  { label: "</>", key: "code", action: (e) => e.chain().focus().toggleCode().run(), isActive: (e) => e.isActive("code") }
];

function isEmptyDoc(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  const v = value as { content?: unknown[] };
  return !v.content || (Array.isArray(v.content) && v.content.length === 0);
}

export function RichTextEditor({ value, onChange, ariaLabel }: RichTextEditorProps) {
  const initial = isEmptyDoc(value) ? "<p></p>" : value!;

  const editor = useEditor({
    extensions: [StarterKit],
    content: initial as never,
    onUpdate({ editor }) {
      onChange(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class: "tiptap-content",
        "aria-label": ariaLabel ?? "Rich text content"
      }
    }
  });

  // Sync external value changes (e.g. when switching between pages) without
  // remounting — only when the JSON we render is genuinely different.
  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value ?? {});
    if (current !== next && !isEmptyDoc(value)) {
      editor.commands.setContent(value as never, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value ?? {}), editor]);

  if (!editor) {
    return <div className="admin-loading">Memuat editor…</div>;
  }

  return (
    <div className="tiptap-editor">
      <div className="tiptap-toolbar" role="toolbar" aria-label="Format teks">
        {TOOLBAR.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.isActive(editor) ? "is-active" : ""}
            onClick={() => item.action(editor)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
