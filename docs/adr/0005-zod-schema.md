# 0005. Zod schema as the source of truth

Status: accepted.

One Zod schema (`looseObject`) validates the scene, produces the JSON Schema and feeds the skill references. Unknown fields become warnings with a "did you mean" suggestion instead of failing, so an agent can fix a scene in one more cycle.
