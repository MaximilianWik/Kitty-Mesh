import type { ReactNode } from 'react'

const INLINE_PATTERN = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let matchIndex = 0

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const [full, code, bold, italic, linkText, linkUrl] = match
    const index = match.index ?? 0
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index))

    const key = `${keyPrefix}-${matchIndex++}`
    if (code !== undefined) nodes.push(<code key={key}>{code}</code>)
    else if (bold !== undefined) nodes.push(<strong key={key}>{bold}</strong>)
    else if (italic !== undefined) nodes.push(<em key={key}>{italic}</em>)
    else if (linkText !== undefined) nodes.push(<a key={key} href={linkUrl} target="_blank" rel="noopener noreferrer">{linkText}</a>)

    lastIndex = index + full.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function parseTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}

export function renderMarkdown(source: string): ReactNode[] {
  const lines = source.replaceAll('\r\n', '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let blockIndex = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      blocks.push(<pre key={`block-${blockIndex++}`}><code>{codeLines.join('\n')}</code></pre>)
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const Tag = `h${Math.min(level, 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      blocks.push(<Tag key={`block-${blockIndex++}`}>{renderInline(headingMatch[2], `h${blockIndex}`)}</Tag>)
      i++
      continue
    }

    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s-|:]+\|?\s*$/.test(lines[i + 1])) {
      const headerCells = parseTableRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(parseTableRow(lines[i]))
        i++
      }
      const tableKey = `block-${blockIndex++}`
      blocks.push(
        <table key={tableKey}>
          <thead>
            <tr>{headerCells.map((cell, index) => <th key={`${tableKey}-h-${index}`}>{renderInline(cell, `${tableKey}-h-${index}`)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${tableKey}-r-${rowIndex}`}>
                {row.map((cell, cellIndex) => <td key={`${tableKey}-r-${rowIndex}-${cellIndex}`}>{renderInline(cell, `${tableKey}-r-${rowIndex}-${cellIndex}`)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>,
      )
      continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
        i++
      }
      const listKey = `block-${blockIndex++}`
      blocks.push(<ul key={listKey}>{items.map((item, index) => <li key={`${listKey}-${index}`}>{renderInline(item, `${listKey}-${index}`)}</li>)}</ul>)
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
        i++
      }
      const listKey = `block-${blockIndex++}`
      blocks.push(<ol key={listKey}>{items.map((item, index) => <li key={`${listKey}-${index}`}>{renderInline(item, `${listKey}-${index}`)}</li>)}</ol>)
      continue
    }

    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*\|.*\|\s*$/.test(lines[i])
    ) {
      paragraphLines.push(lines[i])
      i++
    }
    blocks.push(<p key={`block-${blockIndex++}`}>{renderInline(paragraphLines.join(' '), `p${blockIndex}`)}</p>)
  }

  return blocks
}
