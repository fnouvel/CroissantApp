# CroissantApp — Pre-Coding Journal

Use this file to plan your work and track progress. Before each coding session, review where you left off and decide what to tackle next.

---

## Prompt Sequence Guide

These are suggested prompts to type into Claude Code, in order. You don't have to do them all at once — take it one step at a time.

### Phase 1: Project Setup
1. **"Scaffold the backend with FastAPI"** — Creates the `backend/` folder with a basic FastAPI app, requirements.txt, and project structure.
2. **"Scaffold the frontend with React, Vite, and Tailwind CSS"** — Creates the `frontend/` folder with a working React app and Tailwind configured.
3. **"Make sure both dev servers start without errors"** — Verifies everything is wired up correctly.

### Phase 2: Connect Frontend to Backend
4. **"Create a health-check endpoint in the backend that returns { status: 'ok' }"** — Your first API endpoint.
5. **"Add a component in the frontend that calls the health-check endpoint and displays the result"** — Proves the frontend can talk to the backend.
6. **"Set up CORS in the backend so the frontend can make requests"** — Needed for local development.

### Phase 3: Build Your First Feature
7. **"I want to build [describe your feature]. What API endpoints and components do we need?"** — Let Claude Code help you plan before coding.
8. **"Create the API endpoint for [feature]"** — Backend first.
9. **"Create the React component for [feature]"** — Then frontend.
10. **"Write tests for [feature]"** — Lock it in.

### Phase 4: Polish and Deploy
11. **"Add error handling to the API endpoints"**
12. **"Add loading states and error messages in the frontend"**
13. **"Help me deploy this app"**

---

## Tips for Working with Claude Code
- **Small steps**: Do one thing at a time. It's easier to fix issues when changes are small.
- **Test often**: After each change, check that things still work.
- **Commit frequently**: Use `/commit` in Claude Code after each working change so you can always go back.
- **Ask questions**: If something is confusing, ask Claude Code to explain it.
- **Be specific**: "Add a button that saves the form data" works better than "make it work".

---

## Progress Checklist

### Setup
- [ ] Backend scaffolded (FastAPI running)
- [ ] Frontend scaffolded (React + Vite + Tailwind running)
- [ ] Frontend can call backend API (CORS configured)
- [ ] First commit with working skeleton

### First Feature
- [ ] Feature planned (endpoints + components identified)
- [ ] Backend endpoint(s) created
- [ ] Frontend component(s) created
- [ ] Feature tested and working
- [ ] Committed

### Polish
- [ ] Error handling added
- [ ] Loading states in UI
- [ ] App styled with Tailwind
- [ ] Ready for deployment
