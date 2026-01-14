# Claude Code Guidelines for Sounder Train Schedule

## Feature Development Workflow

For all new features, follow this workflow:

### 1. Implementation
- Always make sure that`main` is up to date with origin
- Create a feature branch from `main`
- Implement the feature with appropriate tests
- Commit frequently at reasonable checkpoints with descriptive commit messages

### 2. User Acceptance Testing (UAT)
- Set up test data using Playwright MCP to inject mock data
- Explain to the user suggested test scenarios
- Present the feature to the user for UAT testing
- Wait for explicit UAT approval before proceeding

### 3. After UAT Approval
- Run existing unit tests: `npm run test`
- Run E2E tests: `npm run test:e2e`
- Update any failing tests
- Update visual regression snapshots if needed
- IMPORTANT: All tests must be fixed. Do not delete failing tests. Do not hack around failures. Fix the root cause always.

### 4. Documentation & Screenshots
- Update `README.md` if the feature is user-facing
- Update promotional screenshots in `docs/screenshots/` if there is new UX:
  - Inject interesting mock data showcasing full app functionality
  - Make sure that the time displayed for the trains showcases the urgency states
  - Include alerts, trains with various urgency states, etc.
  - Capture at mobile viewport size for hero image. The hero image should showcase alerts and urgency states.
  - Screenshots should showcase the full functionality of the app

### 5. Commit & PR
- Commit all changes with a descriptive message
- Make sure to merge main into the branch and resolve conflicts before creating the PR.
- Push branch and create PR

## Project Structure

Key directories:
- `src/components/` - React UI components
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `docs/screenshots/` - Promotional screenshots for README
- `e2e/` - Playwright E2E tests
- `e2e/visual.spec.ts-snapshots/` - Visual regression snapshots

## Running the App

```bash
npm run dev      # Start development server
npm run test     # Run unit tests
npm run test:e2e # Run E2E tests
npm run build    # Build for production
```

## Testing
See TESTING.MD for more testing instructions. 

