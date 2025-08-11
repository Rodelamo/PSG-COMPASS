# SESSION SHORTCUTS - Quick Commands for Development

This file provides quick commands and shortcuts for managing development sessions efficiently.

## 🚀 **Session End Automation**

### **Primary Command (Interactive Mode)**
```bash
npm run session-complete
```
**What it does:**
- Runs the interactive session update script
- Prompts for session summary, changes, files modified, next priorities
- Updates all 5 context files automatically (CLAUDE.md, PROJECT_CONTEXT.md, DEVELOPMENT_LOG.md, COMPONENT_MAP.json, SESSION_TODOS.md)
- Generates comprehensive session report

### **Alternative Commands**
```bash
# Same as session-complete, with confirmation message
npm run dev-complete

# Direct script access (interactive)
npm run session-update
npm run context-update
node session-update.js
```

## 📝 **Quick Session Documentation Template**

When prompted by the script, use this template for consistent documentation:

### **Session Summary Examples**
- "Voice Leader transformation and critical bug fixes"
- "Scale Finder enhancement and visualization improvements"
- "Chord Decipher implementation for Tier 2 functionality"
- "PDF export improvements and desktop app testing"

### **Major Changes Format**
```
Voice Leader simplification, Interval filtering system, Arp/Pluck buttons, Critical bug fixes
```

### **Files Modified Format**
```
src/components/VoiceLeader.js, src/components/ManualEditModal.js, src/components/ProgressionTablature.js, src/data/Notes.js
```

### **Next Priorities Format**
```
Scale Finder enhancement, Chord Decipher implementation, PDF export improvements
```

## 🎯 **Development Workflow Integration**

### **Complete Session Workflow**
```bash
# 1. Start development session
npm start                    # Begin React development

# 2. Work on features/fixes
# ... coding session ...

# 3. Test changes
npm run build               # Verify production build
npm run tauri:dev          # Test desktop app (optional)

# 4. Complete session documentation
npm run session-complete   # Auto-update all context files

# 5. Commit changes (optional)
git add .
git commit -m "Session update: [session summary]"
```

### **Quick Status Check**
```bash
# Check current development status
cat PROJECT_CONTEXT.md | grep -A 10 "Current Project State"

# Check latest todos
cat SESSION_TODOS.md | grep -A 20 "High Priority"

# Check recent changes
cat DEVELOPMENT_LOG.md | grep -A 10 "Latest Session"
```

## 🔧 **Script Customization**

### **Environment Setup**
The `session-update.js` script requires Node.js (included with npm). No additional dependencies needed.

### **Manual File Updates**
If you need to manually update specific files:

```bash
# Update only CLAUDE.md
# (modify session-update.js to include specific functions)

# Update only development log
# (use script functions individually)

# Update only component map
# (JSON file updates for technical changes)
```

### **Script Modification Locations**
```javascript
// session-update.js - Key functions to modify:
// - updateClaudeMd() - Main documentation updates
// - updateDevelopmentLog() - Session chronology  
// - updateComponentMap() - Technical file mapping
// - updateProjectContext() - Current state summary
// - updateSessionTodos() - Task management
```

## ⚡ **Power User Shortcuts**

### **Bash Aliases (Optional)**
Add these to your `.bashrc` or `.zshrc`:
```bash
alias session-done='cd /path/to/project && npm run session-complete'
alias dev-status='cd /path/to/project && cat PROJECT_CONTEXT.md | head -30'
alias next-todos='cd /path/to/project && cat SESSION_TODOS.md | grep -A 10 "High Priority"'
```

### **VS Code Integration**
Add to VS Code tasks.json:
```json
{
    "label": "Complete Development Session",
    "type": "shell", 
    "command": "npm run session-complete",
    "group": "build",
    "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
    }
}
```

### **Command Line One-Liners**
```bash
# Quick session completion with pre-filled data
echo -e "Bug fixes\nFixed tooltips\nsrc/components/\nScale Finder\n2 hours\nSUCCESS" | npm run session-update

# Check if all context files exist
ls -la CLAUDE.md PROJECT_CONTEXT.md DEVELOPMENT_LOG.md COMPONENT_MAP.json SESSION_TODOS.md

# Generate quick status report
echo "Project Status:" && cat PROJECT_CONTEXT.md | grep -A 5 "Production Ready"
```

## 📋 **Session Completion Checklist**

### **Before Running session-complete:**
- [ ] All code changes tested and working
- [ ] No critical errors or console warnings
- [ ] Major features/fixes documented in mental notes
- [ ] File list of modifications ready
- [ ] Next session priorities identified

### **After Running session-complete:**
- [ ] Review generated summary report for accuracy
- [ ] Verify all 5 context files were updated successfully
- [ ] Check SESSION_TODOS.md for proper task marking
- [ ] Optional: Commit changes to git
- [ ] Optional: Test that context files load properly

## 🎯 **Examples of Good Session Documentation**

### **Example 1: Feature Development**
```
Session Summary: "Voice Leader UI enhancement and string selection improvements"
Major Changes: "Added Arp/Pluck buttons, Enhanced string selection UI, Fixed visual bugs, Added Results/Fret control"
Files Modified: "src/components/VoiceLeader.js, src/components/ProgressionTablature.js, src/components/StringToggleButton.js"
Next Priorities: "Scale Finder enhancement, Chord Decipher implementation, PDF export improvements"
Session Duration: "3 hours"
Session Outcome: "SUCCESS"
```

### **Example 2: Bug Fixing**
```
Session Summary: "Critical bug fixes and error handling improvements"  
Major Changes: "Fixed import errors, Resolved tooltip display issues, Added ASCII notation support, Enhanced error handling"
Files Modified: "src/components/VoiceLeader.js, src/components/StringToggleButton.js, src/data/Notes.js"
Next Priorities: "Performance optimization, Desktop app testing, Additional features"
Session Duration: "2 hours"
Session Outcome: "SUCCESS"
```

This shortcut system ensures consistent, comprehensive documentation of all development sessions with minimal effort.