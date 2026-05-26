# AGENTS.md - Shengsuanyun Coding Agent CLI

## Scope

This file applies to:
`/Users/zhouyang/project/shengsuanyun/githuborganization/pi/packages/shengsuanyun-agent`

It documents the Shengsuanyun-specific maintenance strategy for the Pi-based CLI wrapper. Broader Pi repository rules still come from the repository root `AGENTS.md`.

## Product Boundary

1. This package is a thin Shengsuanyun distribution layer on top of upstream Pi.
2. Keep Shengsuanyun-specific changes concentrated in this package and the dedicated publish workflow.
3. Avoid modifying upstream Pi internals unless extension/theme/provider hooks are insufficient and the reason is documented.
4. The default command is `shengsuanyun-agent`.

## Provider Strategy

1. The first supported gateway protocol is OpenAI Chat Completions.
2. The provider uses `api: "openai-completions"`.
3. The default production gateway base URL is `https://router.shengsuanyun.com/api/v1`.
4. Dynamic model discovery should only register models whose `support_apis` include `/chat/completions`.
5. Do not mix Claude Messages, OpenAI Responses, Gemini, or other protocol models into this provider unless the model-specific Pi `api` and streaming/tool-call compatibility are handled explicitly.
6. Future multi-protocol support should use separate provider identities, such as:
   - `shengsuanyun-openai`
   - `shengsuanyun-responses`
   - `shengsuanyun-claude`
   - `shengsuanyun-gemini`

## Version Strategy

1. The npm package version follows the upstream Pi version.
2. If upstream Pi is `0.75.5`, publish `@cocovs/shengsuanyun-coding-agent@0.75.5`.
3. If Shengsuanyun needs another release on the same upstream Pi version, use a prerelease suffix:
   - `0.75.5-shengsuanyun.1`
   - `0.75.5-shengsuanyun.2`
4. Keep the package dependency on `@earendil-works/pi-coding-agent` pinned to the matching upstream version.

## Release Strategy

1. Releases are tag-driven.
2. Use tags with this prefix:
   - `shengsuanyun-agent-v0.75.5`
   - `shengsuanyun-agent-v0.75.5-shengsuanyun.1`
3. The publish workflow extracts the npm version from the tag.
4. Ordinary commits must not publish npm packages automatically.
5. The GitHub repository must configure `NPM_TOKEN` as an Actions secret before publishing.

## Upstream Sync Strategy

1. Keep this fork aligned with upstream Pi through rebase.
2. Add upstream once if needed:
   ```bash
   git remote add upstream https://github.com/earendil-works/pi.git
   ```
3. Sync with:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
4. During rebase, keep Shengsuanyun changes minimal and scoped.
5. Do not rebase already-published release tags.

## Required Verification

After changing this package, run from the repository root:

```bash
npm run check --workspace @cocovs/shengsuanyun-coding-agent
npm pack --workspace @cocovs/shengsuanyun-coding-agent --dry-run
npm run check
git diff --check
```

For provider behavior changes, also run a real gateway smoke test with a test key:

```bash
SHENGSUANYUN_GATEWAY_API_KEY="..." ./node_modules/.bin/shengsuanyun-agent --print "只回复 OK"
```

Do not write API keys, tokens, or environment-specific credentials into files.
