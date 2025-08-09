"use client"

import React from "react"
import { useState, useCallback, useMemo } from "react"
import { Markdown } from "valkoma-package/design-system"
import { Card, CardContent, CardHeader, CardTitle, Textarea, Badge } from "valkoma-package/primitive"
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
                                <Markdown
                                    markdown={markdown}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
