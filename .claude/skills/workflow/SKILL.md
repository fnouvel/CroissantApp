---
name: workflow
description: Print a repeatable workflow guide for planning an app idea, setting it up, and adding new features
---

When the user invokes `/workflow`, print the following guide exactly as written (do not add or remove steps):

---

## Your Workflow

### Planning your app (do this first!)

1. **Describe your idea** — Tell me what you want the app to do in your own words. Don't worry about technical details, just explain it like you're telling a friend.
2. **Answer my questions** — I'll ask you clarifying questions to make sure I understand exactly what you need. Things like: *Who uses it? What should it look like? What are the main things someone can do?*
3. **Review the plan** — I'll update `CLAUDE.md` with the full context of your app — its purpose, features, and how it should work. Read it over and tell me if anything is wrong or missing.
4. **Start building** — Once you're happy with the plan, say *"let's start building"* and I'll follow the setup steps below.

### Setting up the project for the first time

1. **Scaffold the backend** — Tell me: *"Scaffold the backend with FastAPI"* — then check that it runs.
2. **Scaffold the frontend** — Tell me: *"Scaffold the frontend with React, Vite, and Tailwind"* — then check that it runs.
3. **Connect them** — Tell me: *"Set up CORS so the frontend can call the backend"* — then check the connection works.
4. **Save your work** — Type `/commit` to save everything.

### Adding a new feature

1. **Describe what you want** in plain English, then type `/plan` (or press **Shift+Tab**) so I can plan it out first.
2. **Review the plan** — approve it, or ask me to change it.
3. **Test it** — Ask me: *"Does [feature] work? Check for me."*
4. **Save your work** — Type `/commit` to save.

### Rules of thumb

- **One thing at a time.** Don't ask for 5 things in one prompt.
- **If something breaks**, say *"that broke, undo it"* — I can fix it.
- **When you're stuck**, ask *"explain what this code does"* or *"what should I do next?"*

---
