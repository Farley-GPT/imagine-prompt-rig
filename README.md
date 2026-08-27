# Imagine Prompt Rig

Local mixer for Grok Imagine prompts. Fictional adults 18+ only. It does not generate images. It builds a **Desired** sentence and a **Safer** rewrite you paste into Imagine.

Repo: https://github.com/Farley-GPT/imagine-prompt-rig

## Use
Serve the folder (required so `data/library.json` loads):

```bash
python3 -m http.server 8080
```

Visit `http://localhost:8080`.

Optional: enable GitHub Pages on `main` / root.

## Controls
- Age `18-99` or Unknown
- Lock subject / scene / clothes / camera, then **Roll unlocked**
- Packs: Solo boudoir, Community demand, Wild situations, Everything
- Risk cap — use **Copy safer** when over cap
- **Escalate clothes** walks the garment ladder
- **Mutate place / pose** keeps the locked woman

## Add more later
Edit `data/library.json`. Each option:

```json
{ "id": "my-pose", "label": "My pose", "clause": "standing on a fire escape", "risk": "mid", "pack": "wild" }
```

Slots: styles, archetypes, bodies, skins, hair, eyes, clothes, fails, covers, poses, expressions, cameras, lights, finishes, situations.

`synonyms` powers the Safer rewrite.

Longhand source: `library.md`.

## Policy
No real-person likenesses, no under-18 options, no celebrity names. Age selector starts at 18.
