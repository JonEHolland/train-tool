# Claude Code Guidelines for Sounder Train Schedule

## Feature Development Workflow

For all new features, follow this workflow:

### 1. Implementation
- Create a feature branch from `main`
- Implement the feature with appropriate tests

### 2. User Acceptance Testing (UAT)
- Set up test data using Playwright MCP to inject mock data
- Present the feature to the user for UAT testing
- Wait for explicit UAT approval before proceeding

### 3. After UAT Approval
- Run existing unit tests: `npm run test`
- Run E2E tests: `npm run test:e2e`
- Update any failing tests due to the new feature
- Update visual regression snapshots if needed

### 4. Documentation & Screenshots
- Update `README.md` if the feature is user-facing
- Update promotional screenshots in `docs/screenshots/`:
  - Inject interesting mock data showcasing full app functionality
  - Include alerts, trains with various urgency states, etc.
  - Capture at mobile viewport size for hero image
  - Screenshots should showcase the full functionality of the app

### 5. Commit & PR
- Commit all changes with a descriptive message
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

## Testing with Mock Data

Use Playwright MCP to inject mock alerts:
```javascript
await page.route('**/api.allorigins.win/**', async route => {
  const mockAlerts = {
    entity: [
      {
        id: "alert1",
        alert: {
          header_text: { translation: [{ text: "Alert Title", language: "en" }] },
          description_text: { translation: [{ text: "Alert description", language: "en" }] },
          informed_entity: [{ route_id: "SNDR" }]
        }
      }
    ]
  };
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockAlerts)
  });
});
```
