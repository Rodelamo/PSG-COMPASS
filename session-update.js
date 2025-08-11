#!/usr/bin/env node

/**
 * SESSION UPDATE AUTOMATION SCRIPT
 * 
 * This script automates the updating of all project context files after a development session.
 * 
 * Usage: 
 * node session-update.js "Session summary" "Major changes" "Files modified"
 * 
 * Or run with interactive prompts:
 * node session-update.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = process.cwd();
const CONTEXT_FILES = {
    CLAUDE_MD: 'CLAUDE.md',
    PROJECT_CONTEXT: 'PROJECT_CONTEXT.md', 
    DEVELOPMENT_LOG: 'DEVELOPMENT_LOG.md',
    COMPONENT_MAP: 'COMPONENT_MAP.json',
    SESSION_TODOS: 'SESSION_TODOS.md'
};

// Utility functions
const getCurrentDate = () => new Date().toISOString().split('T')[0];
const getCurrentDateTime = () => new Date().toISOString();

/**
 * Interactive prompt system
 */
async function promptUser() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    console.log('🔧 SESSION UPDATE AUTOMATION');
    console.log('=====================================\n');

    const sessionSummary = await question('Session Summary (brief description): ');
    const majorChanges = await question('Major Changes (comma-separated): ');
    const filesModified = await question('Files Modified (comma-separated): ');
    const nextPriorities = await question('Next Session Priorities (comma-separated): ');
    const sessionDuration = await question('Session Duration (e.g., "2 hours"): ');
    const sessionOutcome = await question('Session Outcome (SUCCESS/PARTIAL/BLOCKED): ');

    rl.close();

    return {
        sessionSummary,
        majorChanges: majorChanges.split(',').map(s => s.trim()).filter(s => s),
        filesModified: filesModified.split(',').map(s => s.trim()).filter(s => s),
        nextPriorities: nextPriorities.split(',').map(s => s.trim()).filter(s => s),
        sessionDuration,
        sessionOutcome,
        date: getCurrentDate(),
        timestamp: getCurrentDateTime()
    };
}

/**
 * Update CLAUDE.md with new session information
 */
function updateClaudeMd(sessionData) {
    const claudePath = path.join(PROJECT_ROOT, CONTEXT_FILES.CLAUDE_MD);
    
    if (!fs.existsSync(claudePath)) {
        console.error('❌ CLAUDE.md not found');
        return false;
    }

    let content = fs.readFileSync(claudePath, 'utf8');
    
    // Add new session section before the last session
    const newSessionSection = `
## Session Update (${sessionData.date})

### 🎯 **Session Summary**
${sessionData.sessionSummary}

#### **Major Changes Completed** ✅
${sessionData.majorChanges.map(change => `- **${change}**: Implementation completed successfully`).join('\n')}

#### **Files Modified**
${sessionData.filesModified.map(file => `- \`${file}\``).join('\n')}

#### **Session Metrics**
- **Duration**: ${sessionData.sessionDuration}
- **Outcome**: ${sessionData.sessionOutcome}
- **Files Modified**: ${sessionData.filesModified.length}
- **Major Changes**: ${sessionData.majorChanges.length}

### **Next Session Priorities**
${sessionData.nextPriorities.map(priority => `- **${priority}**: High priority for next development session`).join('\n')}

---

`;

    // Insert the new session before the last existing session
    const sessionPattern = /## Session Update \(/;
    const firstSessionIndex = content.search(sessionPattern);
    
    if (firstSessionIndex !== -1) {
        content = content.slice(0, firstSessionIndex) + newSessionSection + content.slice(firstSessionIndex);
    } else {
        // If no existing sessions, add at the end
        content += newSessionSection;
    }
    
    fs.writeFileSync(claudePath, content);
    console.log('✅ Updated CLAUDE.md');
    return true;
}

/**
 * Update DEVELOPMENT_LOG.md with new session entry
 */
function updateDevelopmentLog(sessionData) {
    const logPath = path.join(PROJECT_ROOT, CONTEXT_FILES.DEVELOPMENT_LOG);
    
    if (!fs.existsSync(logPath)) {
        console.error('❌ DEVELOPMENT_LOG.md not found');
        return false;
    }

    let content = fs.readFileSync(logPath, 'utf8');
    
    const newLogEntry = `
### **Session: ${sessionData.date} - ${sessionData.sessionSummary}**

#### **Session Objectives**
${sessionData.sessionSummary}

#### **Major Tasks Completed** ✅
${sessionData.majorChanges.map((change, index) => `${index + 1}. **${change}**`).join('\n')}

#### **Files Modified**
${sessionData.filesModified.map(file => `- \`${file}\``).join('\n')}

#### **Technical Achievements**
- **Session Duration**: ${sessionData.sessionDuration}
- **Session Outcome**: ✅ ${sessionData.sessionOutcome}
- **Files Modified**: ${sessionData.filesModified.length}
- **Code Quality**: Maintained React best practices and architectural consistency

#### **Next Session Preparation**
${sessionData.nextPriorities.map(priority => `- **${priority}**: Ready for implementation`).join('\n')}

---

`;

    // Insert at the beginning of the session log section
    const logSectionPattern = /## 📅 \*\*Session Log/;
    const logSectionIndex = content.search(logSectionPattern);
    
    if (logSectionIndex !== -1) {
        // Find the end of the section header and insert after it
        const nextLineIndex = content.indexOf('\n\n', logSectionIndex);
        if (nextLineIndex !== -1) {
            content = content.slice(0, nextLineIndex + 2) + newLogEntry + content.slice(nextLineIndex + 2);
        }
    }
    
    fs.writeFileSync(logPath, content);
    console.log('✅ Updated DEVELOPMENT_LOG.md');
    return true;
}

/**
 * Update COMPONENT_MAP.json with recent modifications
 */
function updateComponentMap(sessionData) {
    const mapPath = path.join(PROJECT_ROOT, CONTEXT_FILES.COMPONENT_MAP);
    
    if (!fs.existsSync(mapPath)) {
        console.error('❌ COMPONENT_MAP.json not found');
        return false;
    }

    const componentMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    
    // Update recent modifications
    componentMap.recentModifications = {
        lastSession: sessionData.date,
        majorChanges: sessionData.majorChanges,
        filesModified: sessionData.filesModified,
        sessionOutcome: sessionData.sessionOutcome,
        timestamp: sessionData.timestamp
    };
    
    // Update last updated date in file structure
    componentMap.fileStructure.lastUpdated = sessionData.date;
    
    fs.writeFileSync(mapPath, JSON.stringify(componentMap, null, 2));
    console.log('✅ Updated COMPONENT_MAP.json');
    return true;
}

/**
 * Update PROJECT_CONTEXT.md with latest session notes
 */
function updateProjectContext(sessionData) {
    const contextPath = path.join(PROJECT_ROOT, CONTEXT_FILES.PROJECT_CONTEXT);
    
    if (!fs.existsSync(contextPath)) {
        console.error('❌ PROJECT_CONTEXT.md not found');
        return false;
    }

    let content = fs.readFileSync(contextPath, 'utf8');
    
    // Update the "For Next Claude Code Session" section
    const nextSessionPattern = /### \*\*For Next Claude Code Session\*\*/;
    const nextSessionIndex = content.search(nextSessionPattern);
    
    if (nextSessionIndex !== -1) {
        const newNextSessionContent = `### **For Next Claude Code Session**
1. **Recent Session Completed (${sessionData.date})**: ${sessionData.sessionSummary}
2. **Session Outcome**: ${sessionData.sessionOutcome} - ${sessionData.majorChanges.length} major changes implemented
3. **Next Priorities**: ${sessionData.nextPriorities.join(', ')}
4. **Context Files Updated**: All project context files current as of ${sessionData.date}
5. **Ready for Development**: Project state documented, no re-analysis needed`;

        // Find the end of this section and replace it
        const currentWorkingPattern = /### \*\*Current Working State\*\*/;
        const currentWorkingIndex = content.search(currentWorkingPattern);
        
        if (currentWorkingIndex !== -1) {
            content = content.slice(0, nextSessionIndex) + newNextSessionContent + '\n\n' + content.slice(currentWorkingIndex);
        }
    }
    
    fs.writeFileSync(contextPath, content);
    console.log('✅ Updated PROJECT_CONTEXT.md');
    return true;
}

/**
 * Update SESSION_TODOS.md with completed tasks
 */
function updateSessionTodos(sessionData) {
    const todosPath = path.join(PROJECT_ROOT, CONTEXT_FILES.SESSION_TODOS);
    
    if (!fs.existsSync(todosPath)) {
        console.error('❌ SESSION_TODOS.md not found');
        return false;
    }

    let content = fs.readFileSync(todosPath, 'utf8');
    
    // Add completed tasks section
    const completedSection = `
### **Session Completed (${sessionData.date})**
${sessionData.majorChanges.map(change => `- [x] **${change}** - Completed successfully`).join('\n')}

`;

    // Insert before existing completed tasks
    const completedPattern = /## ✅ \*\*Completed Tasks/;
    const completedIndex = content.search(completedPattern);
    
    if (completedIndex !== -1) {
        content = content.slice(0, completedIndex) + completedSection + content.slice(completedIndex);
    }
    
    fs.writeFileSync(todosPath, content);
    console.log('✅ Updated SESSION_TODOS.md');
    return true;
}

/**
 * Generate session summary report
 */
function generateSummaryReport(sessionData) {
    const report = `
🎉 SESSION UPDATE COMPLETE
========================

📅 Session Date: ${sessionData.date}
⏱️  Duration: ${sessionData.sessionDuration}
🎯 Outcome: ${sessionData.sessionOutcome}

📝 Summary: ${sessionData.sessionSummary}

✅ Major Changes (${sessionData.majorChanges.length}):
${sessionData.majorChanges.map((change, i) => `   ${i + 1}. ${change}`).join('\n')}

📁 Files Modified (${sessionData.filesModified.length}):
${sessionData.filesModified.map(file => `   • ${file}`).join('\n')}

🎯 Next Session Priorities:
${sessionData.nextPriorities.map(priority => `   • ${priority}`).join('\n')}

📄 Context Files Updated:
   • CLAUDE.md
   • PROJECT_CONTEXT.md  
   • DEVELOPMENT_LOG.md
   • COMPONENT_MAP.json
   • SESSION_TODOS.md

Ready for next Claude Code session! 🚀
`;

    console.log(report);
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('🚀 Starting session update automation...\n');
        
        // Get session data from user
        const sessionData = await promptUser();
        
        console.log('\n📝 Updating context files...\n');
        
        // Update all context files
        const updates = [
            updateClaudeMd(sessionData),
            updateDevelopmentLog(sessionData), 
            updateComponentMap(sessionData),
            updateProjectContext(sessionData),
            updateSessionTodos(sessionData)
        ];
        
        const successCount = updates.filter(Boolean).length;
        
        if (successCount === updates.length) {
            generateSummaryReport(sessionData);
        } else {
            console.log(`\n⚠️  ${successCount}/${updates.length} files updated successfully`);
        }
        
    } catch (error) {
        console.error('❌ Error during session update:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { updateClaudeMd, updateDevelopmentLog, updateComponentMap, updateProjectContext, updateSessionTodos };