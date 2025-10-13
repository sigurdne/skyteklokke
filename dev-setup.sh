#!/bin/bash

# SkyteKlokke Development Setup Script
# This script ensures all documentation is accessible for AI agents

echo "🎯 SkyteKlokke Development Environment Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "PROSJEKTPLAN.md" ]; then
    echo "❌ Error: Must be run from skyteklokke project root"
    exit 1
fi

echo "📚 Verifying core documentation files..."

# Check required documentation files
required_files=("PROSJEKTPLAN.md" "TEKNISK_DESIGN.md" "I18N_PLAN.md" "DOCS.md" ".copilot-instructions.md")
missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "⚠️  Missing required documentation files. AI agents may lack context."
fi

# Open VS Code with workspace and documentation
echo ""
echo "🚀 Opening VS Code with SkyteKlokke workspace..."
echo "📖 Key files for AI context:"
echo "   - DOCS.md (Documentation index)"
echo "   - PROSJEKTPLAN.md (Project requirements)"
echo "   - TEKNISK_DESIGN.md (Technical architecture)"
echo "   - I18N_PLAN.md (Multi-language support)"
echo ""

# Open workspace file if it exists, otherwise open directory
if [ -f ".vscode/skyteklokke.code-workspace" ]; then
    code .vscode/skyteklokke.code-workspace
else
    code .
fi

echo "🤖 GitHub Copilot is configured to:"
echo "   - Prioritize documentation files for context"
echo "   - Follow modular BaseProgram architecture"
echo "   - Include i18n support for all user-facing text"
echo "   - Maintain audio timing precision for shooting"
echo ""
echo "💡 Pro tip: Reference DOCS.md for quick context overview"
echo "✨ Happy coding! Remember: Precision matters for competitive shooting."