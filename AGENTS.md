# Project Prompt

## Workspace

- Frontend repo path: `D:\Projects\OnlineForms-Frontend`
- Backend repo path: `..\OnlineForms`
- Resolve the backend repo relative to this folder when a task needs backend context.

## Delivery Rules

- Frontend and backend have independent phase plans defined in their own repositories.
- Treat frontend phases and backend phases as separate tracks. Do not assume task numbering or scope matches across repos.
- Each phase contains a list of tasks.
- Every task must link to a GitHub issue in the same repository as the task.
- Use one commit per task.
- Do not combine multiple tasks into one commit.

## Working Expectations

- Before implementing a task, identify which repo owns it and use that repo's phase/task definition and GitHub issue.
- When work spans both repos, split it into separate frontend and backend tasks if the phase plans define them separately.
- Keep commit history aligned with the issue/task structure for that repo.
