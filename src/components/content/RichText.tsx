const allowedTags = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'EM',
  'H2',
  'H3',
  'H4',
  'HR',
  'LI',
  'OL',
  'P',
  'STRONG',
  'UL',
])

function sanitizeHtml(html: string) {
  if (typeof window === 'undefined') {
    return html
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const nodes = Array.from(doc.body.querySelectorAll('*'))

  for (const node of nodes) {
    if (!allowedTags.has(node.tagName)) {
      const text = doc.createTextNode(node.textContent || '')
      node.replaceWith(text)
      continue
    }

    const attributes = Array.from(node.attributes)
    for (const attribute of attributes) {
      const name = attribute.name.toLowerCase()

      if (name.startsWith('on') || name === 'style') {
        node.removeAttribute(attribute.name)
        continue
      }

      if (node.tagName !== 'A') {
        node.removeAttribute(attribute.name)
      }
    }

    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || ''
      const isSafeHref =
        href.startsWith('/') ||
        href.startsWith('#') ||
        href.startsWith('https://') ||
        href.startsWith('http://') ||
        href.startsWith('mailto:')

      if (!isSafeHref) {
        node.removeAttribute('href')
      }

      if (href.startsWith('http://') || href.startsWith('https://')) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noreferrer')
      } else {
        node.removeAttribute('target')
        node.removeAttribute('rel')
      }
    }
  }

  return doc.body.innerHTML
}

type RichTextProps = {
  html: string
  className?: string
}

export function RichText({ html, className }: RichTextProps) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  )
}
