# Website Rebuild Templates

Reusable configuration files for bootstrapping a new Astro website rebuild project with Claude Code.

## Setup

1. Create a new project directory and `git init`
2. Copy these files into the new project:
   - `CLAUDE.md` → project root (will be gitignored)
   - `INTAKE.md` → project root (delete after initial session)
   - `.gitignore` → project root
3. Create the `.claude/` directory structure:
   - `mkdir -p .claude/projects/<project-path>/memory`
   - Copy `memory/MEMORY.md` and `memory/user_preferences.md` into that memory dir
4. Start Claude Code in the project directory
5. Tell Claude: "Read INTAKE.md and start the intake process"
6. Claude will ask clarifying questions, then generate a spec and plan
7. Once approved, Claude executes the plan

## Files

| File | Destination | Purpose |
|------|-------------|---------|
| `CLAUDE.md` | `<project>/CLAUDE.md` | Project instructions for Claude Code |
| `INTAKE.md` | `<project>/INTAKE.md` | Intake questionnaire — Claude asks these questions first |
| `.gitignore` | `<project>/.gitignore` | Pre-configured for Astro + Claude Code |
| `memory/MEMORY.md` | `.claude/projects/.../memory/MEMORY.md` | Memory index with user preferences |
| `memory/user_preferences.md` | `.claude/projects/.../memory/user_preferences.md` | Your workflow preferences |
| `memory/feedback_design_patterns.md` | `.claude/projects/.../memory/feedback_design_patterns.md` | Design feedback from prior projects |
