#!/usr/bin/env python3
"""
Shared Context Manager — keeps WebChat and Telegram in sync.
Call this after every significant interaction to update the current task context.

Usage:
    python3 context.py --set "Posting to Instagram" --note "Carousel uploaded, waiting approval"
    python3 context.py --status "Working on website hosting"
    python3 context.py --task "Website" --next "Grab ZIP from IONOS, push to Render"
    python3 context.py --read           # Print current context
"""
import json, os, sys
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
CONTEXT_FILE = os.path.join(BASE, "memory", "current_task.md")
LOG_FILE = os.path.join(BASE, "memory", "task_history.md")

def read_context():
    """Read the current task context"""
    if not os.path.exists(CONTEXT_FILE):
        return {"task": None, "status": None, "next": None, "channel": None}
    
    with open(CONTEXT_FILE) as f:
        content = f.read()
    
    def extract(label):
        for line in content.split('\n'):
            if line.startswith(label):
                return line.replace(label, '').strip()
        return None
    
    return {
        'active': extract('**Active:**'),
        'task': extract('**Current Task:**'),
        'last_action': extract('- **Action:**'),
        'next': extract('## Next Step'),
        'project': extract('## Project Context'),
    }

def write_context(channel, task, action, next_step, project, notes=""):
    """Write the current task context"""
    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    content = f"""# Current Active Task
Auto-updated by Mr. Cool. Read this on session start to catch up.

## Status
**Active:** YES

## Current Task
{task}

## Last Action
- **Time:** {now}
- **Action:** {action}
- **Channel:** {channel}

## Next Step
{next_step}

## Project Context
{project}

## Notes
{notes}

---

*Last updated: {now} from {channel}*
"""
    with open(CONTEXT_FILE, 'w') as f:
        f.write(content)
    
    # Append to rolling history
    with open(LOG_FILE, 'a') as f:
        f.write(f"\n| {now} | {channel} | {task[:50]} | {action[:50]} |")
    
    print(f"✅ Context updated from {channel}")

def read_history(lines=10):
    """Read the last N lines of task history"""
    if not os.path.exists(LOG_FILE):
        return "No history yet"
    
    with open(LOG_FILE) as f:
        all_lines = f.readlines()
    
    return ''.join(all_lines[-lines:])

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] == '--read':
        ctx = read_context()
        print(f"Active: {ctx.get('active', 'N/A')}")
        print(f"Task: {ctx.get('task', 'None')}")
        print(f"Last: {ctx.get('last_action', 'N/A')}")
        print(f"Next: {ctx.get('next', 'Waiting')}")
        print(f"\nRecent history:")
        print(read_history(5))
    elif sys.argv[1] == '--set':
        task = sys.argv[2] if len(sys.argv) > 2 else "No task"
        action = sys.argv[3] if len(sys.argv) > 3 else ""
        next_step = sys.argv[4] if len(sys.argv) > 4 else "Waiting for Mr D"
        write_context("webchat", task, action, next_step, "")
