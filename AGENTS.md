<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-design-rules -->
# UI design (anti-slop + Apple HIG tokens)

When changing UI/CSS/components, follow:

1. `.cursor/skills/baseline-ui/SKILL.md` — deslop constraints ([ui-skills](https://github.com/ibelick/ui-skills))
2. `.cursor/skills/apple-hig-ui/SKILL.md` — Apple HIG–inspired tokens/patterns
3. `DESIGN.md` + `src/styles/apple-hig-tokens.css`

CLI: `npm run ui-skills:list` / `npm run ui-skills:baseline`
<!-- END:ui-design-rules -->
