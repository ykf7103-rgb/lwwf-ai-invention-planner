# AI發明品構思助手網站

LWWF 2026-2027 AI/STEAM invention planning tool for teachers.

## Purpose

This site helps teachers create invention concepts that combine:

- an AI website or laptop-based software prototype
- a micro:bit / Robotbit / KittenBot sensor hardware prototype
- AI and IoT interaction
- a clear school exhibition and competition story

The content is grounded in the 2025-2026 AI development group third meeting record and the final 13-group STEAM exhibition workbook.

## Deployment

- Cloudflare Worker: `lwwf-ai-invention-planner`
- Source repo: `ykf7103-rgb/lwwf-ai-invention-planner`
- Central AI proxy: `lwwf-ai-proxy`

Secrets are required in Cloudflare and must not be committed:

- `TEACHER_PW`: teacher access password for AI actions
- `LWWF_PROXY_TOKEN`: project-specific proxy token accepted by `lwwf-ai-proxy`

## Local Checks

```powershell
npm run check
npx wrangler dev
```

## AI Routes Used

- Alibaba/Qwen web-search reasoning: `POST /v1/invention/alibaba-research`
- ChatGPT proposal writing: `POST /v1/chat/completions`
- GPT Image 2 preview image: `POST /v1/images/generations`
