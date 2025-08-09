"use client"

import React from "react"
import { useState, useCallback, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import { Card, CardContent, CardHeader, CardTitle, Textarea, Button, Badge, Separator } from "valkoma-package/primitive"
import { Copy, Download, FileText, Fullscreen, LetterText, Trash2 } from "lucide-react"
import { useToast } from "valkoma-package/hooks"
import { ButtonGroup } from "./button-group"

const SAMPLE_MARKDOWN = `# Welcome to Markdown Viewer

___

This is a **live markdown editor** with instant preview functionality.

## Features

- ✅ Real-time preview
- ✅ Syntax highlighting
- ✅ Security sanitization
- ✅ Responsive design
- ✅ Error handling

### Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to the markdown viewer!\`;
}

greet("Developer");
\`\`\`

### Python Example

\`\`\`python
def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

print(calculate_fibonacci(10))
\`\`\`

### Lists and Links

1. **Ordered lists** work perfectly
2. [Links are supported](https://example.com)
3. \`Inline code\` is highlighted

> **Note**: This viewer sanitizes content to prevent XSS attacks.

### Table Support

| Feature | Status | Priority |
|---------|--------|----------|
| Live Preview | ✅ Complete | High |
| Syntax Highlighting | ✅ Complete | High |
| Security | ✅ Complete | Critical |

---

**Try pasting your own markdown content!**`

interface MarkdownStats {
    characters: number
    words: number
    lines: number
}

// Simple syntax highlighting function
const highlightCode = (code: string, language: string) => {
    const keywords: Record<string, string[]> = {
        javascript: [
            "function", "const", "let", "var", "if", "else", "for", "while", "return", "class",
            "import", "export", "async", "await", "try", "catch", "finally", "new", "this",
        ],
        typescript: [
            "function", "const", "let", "var", "if", "else", "for", "while", "return", "class", "import", "export",
            "async", "await", "try", "catch", "finally", "new", "this", "interface", "type", "enum", "implements",
            "readonly", "public", "private", "protected", "as", "typeof"
        ],
        python: [
            "def", "class", "if", "else", "elif", "for", "while", "return", "import", "from",
            "as", "try", "except", "with", "lambda", "yield", "self",
        ],
        java: [
            "public", "private", "protected", "class", "interface", "if", "else", "for", "while",
            "return", "import", "package", "static", "final", "void", "new", "extends", "implements",
        ],
        css: [
            "color", "background", "margin", "padding", "border", "width", "height", "display",
            "position", "flex", "grid", "align", "justify", "z-index", "font", "text", "line-height",
        ],
        html: [
            "div", "span", "p", "h1", "h2", "h3", "body", "head", "html", "script", "style", "link",
            "meta", "title", "input", "form", "button",
        ],
        bash: [
            "cd", "ls", "mkdir", "rm", "touch", "echo", "cat", "pwd", "chmod", "chown", "sudo",
            "apt", "brew", "mv", "cp", "kill", "grep", "tail", "head", "export", "source",
        ],
        git: [
            "git", "clone", "commit", "push", "pull", "status", "checkout", "merge", "rebase",
            "branch", "log", "diff", "add", "init", "remote", "fetch", "tag", "stash", "reset",
        ],
        terminal: [
            "$", "#", "~", ">", "./", "../", "bash", "zsh", "sh", "node", "npm", "yarn", "pnpm",
        ],
    }

    // Escape HTML first to prevent XSS
    let highlightedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")

    const langKeywords = keywords[language.toLowerCase()] || []

    // Highlight strings first (before keywords to avoid conflicts)
    highlightedCode = highlightedCode.replace(/(`[^`]*`|"[^"]*"|'[^']*')/g, '<span class="code-string">$1</span>')

    // Highlight comments
    highlightedCode = highlightedCode.replace(
        /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g,
        '<span class="code-comment">$1</span>',
    )

    // Highlight numbers (avoid highlighting inside strings/comments)
    highlightedCode = highlightedCode.replace(
        /(?<!<span class="code-[^"]*">.*)\b(\d+\.?\d*)\b(?![^<]*<\/span>)/g,
        '<span class="code-number">$1</span>',
    )

    // Highlight keywords (avoid highlighting inside strings/comments)
    langKeywords.forEach((keyword) => {
        const regex = new RegExp(`(?<!<span class="code-[^"]*">.*?)\\b(${keyword})\\b(?![^<]*<\/span>)`, "g")
        highlightedCode = highlightedCode.replace(regex, '<span class="code-keyword">$1</span>')
    })

    return highlightedCode
}

export default function ValkomaMarkdown() {
    const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN)
    const { toast } = useToast()

    const stats = useMemo((): MarkdownStats => {
        const characters = markdown.length
        const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0
        const lines = markdown.split("\n").length
        return { characters, words, lines }
    }, [markdown])

    const handleMarkdownChange = useCallback(
        (value: string) => {
            // Character limit for performance
            if (value.length > 50000) {
                toast({
                    title: "Content too large",
                    description: "Please keep content under 50,000 characters for optimal performance.",
                    variant: "destructive",
                })
                return
            }
            setMarkdown(value)
        },
        [toast],
    )

    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            const pastedText = e.clipboardData.getData("text")
            if (pastedText) {
                toast({
                    title: "Content pasted",
                    description: "Markdown preview updated automatically.",
                })
            }
        },
        [toast],
    )

    const copyToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(markdown)
            toast({
                title: "Copied to clipboard",
                description: "Markdown content has been copied successfully.",
            })
        } catch (err) {
            toast({
                title: "Copy failed",
                description: "Unable to copy content to clipboard.",
                variant: "destructive",
            })
        }
    }, [markdown, toast])

    const downloadMarkdown = useCallback(() => {
        const blob = new Blob([markdown], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "document.md"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
            title: "Download started",
            description: "Your markdown file is being downloaded.",
        })
    }, [markdown, toast])

    const clearContent = useCallback(() => {
        setMarkdown("")
        toast({
            title: "Content cleared",
            description: "Editor has been reset.",
        })
    }, [toast])

    const customComponents = {
        code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : "text"

            if (!inline && match) {
                const codeString = String(children).replace(/\n$/, "")
                const highlightedCode = highlightCode(codeString, language)

                return (
                    <div className="code-block-container">
                        <div className="code-block-header">
                            <span className="code-language">{language}</span>
                            <button
                                className="code-copy-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(codeString)
                                    toast({ title: "Code copied!", description: "Code block copied to clipboard." })
                                }}
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                        <pre className="code-block">
                            <code
                                dangerouslySetInnerHTML={{ __html: highlightedCode }}
                                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                            />
                        </pre>
                    </div>
                )
            }

            return (
                <code className="inline-code" {...props}>
                    {children}
                </code>
            )
        },
        h1: ({ children }: any) => <span className="text-3xl font-bold mb-4 text-foreground pb-2">{children}</span>,
        h2: ({ children }: any) => <span className="text-2xl font-semibold mb-3 text-foreground">{children}</span>,
        h3: ({ children }: any) => <span className="text-xl font-medium mb-2 text-foreground">{children}</span>,
        blockquote: ({ children }: any) => (
            <blockquote className="!border-l-4 !border-primary [&>p]:!my-2 !pl-4 !italic !my-4 !text-muted-foreground bg-muted !py-2 !rounded-r">
                {children}
            </blockquote>
        ),
        table: ({ children }: any) => (
            <div className="overflow-x-auto my-4">
                <table className="!min-w-full !border-collapse !border !border-border !rounded-lg !overflow-hidden">{children}</table>
            </div>
        ),
        th: ({ children }: any) => (
            <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">{children}</th>
        ),
        tr: ({ children }: any) => (
            <tr className="  hover:bg-muted transition-colors duration-200">
                {children}
            </tr>
        ),
        td: ({ children }: any) => <td className="border border-border px-4 py-2">{children}</td>,
        ul: ({ children }: any) => <ul className="!list-disc !list-inside !my-4 !space-y-1">{children}</ul>,
        ol: ({ children }: any) => <ol className="!list-decimal !list-inside !my-4 !space-y-1">{children}</ol>,
        li: ({ children }: any) => <li className="!ml-4 !mb-2">{children}</li>,
        a: ({ children, href }: any) => (
            <a href={href} className="!text-primary !hover:underline !font-medium" target="_blank" rel="noopener noreferrer">
                {children}
            </a>
        ),
        p: ({ children }: any) => <p className="!mb-4 !leading-relaxed">{children}</p>,
        hr: () => <Separator className="my-4" />,
    }

    return (

        <div className="h-screen bg-background">
            <div className="container mx-auto p-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8 pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            <h1 className="!text-2xl !font-bold">alleJKomal Markdown Preview</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                {stats.characters} chars
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                {stats.words} words
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                {stats.lines} lines
                            </Badge>
                            <ButtonGroup
                                size="sm"
                                items={[
                                    {
                                        id: "cat",
                                        icon: <Copy className="w-4 h-4 ml-2" />,
                                        onClick: copyToClipboard,
                                    },
                                    {
                                        id: "dog",
                                        icon: <Download className="w-4 h-4 mx-2" />,
                                        onClick: downloadMarkdown,
                                    },
                                    {
                                        id: "dog",
                                        icon: <Trash2 className="w-4 h-4 mr-2" />,
                                        onClick: clearContent,
                                    },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Editor Panel */}
                    <Card className="shadow-none">
                        <CardHeader className="py-2 pt-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <LetterText className="w-5 h-5" />
                                Markdown Editor
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            <Textarea
                                value={markdown}
                                onChange={(e) => handleMarkdownChange(e.target.value)}
                                onPaste={handlePaste}
                                placeholder="Paste or type your markdown content here..."
                                className="min-h-[600px] font-mono text-sm resize-none border-none shadow-none bg-muted"
                                spellCheck={false}
                            />
                        </CardContent>
                    </Card>

                    {/* Preview Panel */}
                    <Card className="shadow-none">
                        <CardHeader className="py-2 pt-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Fullscreen className="w-5 h-5" />
                                Live Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[600px] overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
                                <ErrorBoundary>
                                    <ReactMarkdown
                                        className="min-h-[600px]"
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeSanitize]}
                                        components={customComponents}
                                    >
                                        {markdown || "*No content to preview*"}
                                    </ReactMarkdown>
                                </ErrorBoundary>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
    constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Markdown rendering error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 border border-destructive rounded-md bg-destructive/10">
                    <h3 className="font-semibold text-destructive mb-2">Rendering Error</h3>
                    <p className="text-sm text-muted-foreground">
                        There was an error rendering the markdown content. Please check your syntax.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Try Again
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
