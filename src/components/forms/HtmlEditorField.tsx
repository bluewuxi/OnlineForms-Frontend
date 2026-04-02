import { useId, useState } from 'react'
import { RichText } from '../content/RichText'

type HtmlEditorFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  rows?: number
}

export function HtmlEditorField({
  label,
  value,
  onChange,
  hint = 'Allowed HTML: paragraphs, headings, lists, emphasis, links, blockquotes, and rules.',
  rows = 8,
}: HtmlEditorFieldProps) {
  const [mode, setMode] = useState<'html' | 'preview'>('html')
  const id = useId()
  const previewId = `${id}-preview`

  return (
    <div className="session-form__field">
      <div className="html-editor__header">
        <div>
          <label htmlFor={id}>{label}</label>
          <p className="html-editor__hint">{hint}</p>
        </div>
        <div className="html-editor__toggle" role="tablist" aria-label={`${label} editor mode`}>
          <button
            className={mode === 'html' ? 'html-editor__tab html-editor__tab--active' : 'html-editor__tab'}
            onClick={() => setMode('html')}
            type="button"
            role="tab"
            aria-selected={mode === 'html'}
            aria-controls={id}
          >
            HTML
          </button>
          <button
            className={mode === 'preview' ? 'html-editor__tab html-editor__tab--active' : 'html-editor__tab'}
            onClick={() => setMode('preview')}
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            aria-controls={previewId}
          >
            Preview
          </button>
        </div>
      </div>
      {mode === 'html' ? (
        <textarea
          id={id}
          className="html-editor__input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
        />
      ) : (
        <div id={previewId} className="html-editor__preview" role="tabpanel">
          {value.trim() ? (
            <RichText html={value} className="rich-text" />
          ) : (
            <p className="html-editor__empty">Preview will appear here once content is entered.</p>
          )}
        </div>
      )}
    </div>
  )
}
