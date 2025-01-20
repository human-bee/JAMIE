#!/bin/bash

# Create labels
echo "Creating labels..."

# Priority labels
gh label create priority:emergency --color FF0000 --description "Critical issues that need immediate attention"
gh label create priority:high --color FF6B6B --description "Important issues to be addressed soon"
gh label create priority:medium --color FFA500 --description "Regular priority issues"
gh label create priority:low --color 92D050 --description "Nice-to-have improvements"

# Timeframe labels
gh label create timeframe:short-term --color 00B0F0 --description "To be completed within 1-2 weeks"
gh label create timeframe:long-term --color 0070C0 --description "To be completed within 1-2 months"
gh label create timeframe:future --color 7030A0 --description "Future considerations"

# Type labels
gh label create type:bug --color D4351C --description "Something isn't working"
gh label create type:feature --color 0B875B --description "New feature or enhancement"
gh label create type:security --color CC0000 --description "Security-related tasks"
gh label create type:performance --color 6F42C1 --description "Performance improvements"
gh label create type:documentation --color 0075CA --description "Documentation updates"
gh label create type:testing --color FBCA04 --description "Testing-related tasks"

# Create project board
echo "Creating project board..."
gh project create JAMIE --org human-bee --title "JAMIE Development" --template "Automated kanban"

# Create milestones
echo "Creating milestones..."
gh api repos/human-bee/JAMIE/milestones -f title="MVP Release" -f description="Basic functionality including real-time transcription and AI commentary" -f due_on="2024-03-31"
gh api repos/human-bee/JAMIE/milestones -f title="Beta Release" -f description="Full feature set with basic UI and collaboration features" -f due_on="2024-04-30"
gh api repos/human-bee/JAMIE/milestones -f title="1.0 Release" -f description="Production-ready release with all core features" -f due_on="2024-05-31"

# Create initial issues
echo "Creating initial issues..."

# Emergency issues
gh issue create --title "Add error handling for failed API calls" --body "Implement comprehensive error handling for OpenAI, LiveKit, and MongoDB connections" --label "priority:emergency,type:security" --milestone "MVP Release"
gh issue create --title "Implement environment variable validation" --body "Add startup validation for all required environment variables" --label "priority:emergency,type:security" --milestone "MVP Release"
gh issue create --title "Add rate limiting for AI endpoints" --body "Implement request throttling and usage quotas" --label "priority:emergency,type:security" --milestone "MVP Release"

# Short-term issues
gh issue create --title "Implement file upload progress indicators" --body "Add visual feedback for file upload progress" --label "timeframe:short-term,type:feature" --milestone "MVP Release"
gh issue create --title "Add retry logic for failed transcription attempts" --body "Implement automatic retry with backoff strategy" --label "timeframe:short-term,type:feature" --milestone "MVP Release"
gh issue create --title "Set up basic logging and monitoring" --body "Implement Winston logging and basic performance monitoring" --label "timeframe:short-term,type:feature" --milestone "MVP Release"

# Long-term issues
gh issue create --title "Implement magazine-style UI layout" --body "Create a multi-page layout with magazine-style navigation" --label "timeframe:long-term,type:feature" --milestone "Beta Release"
gh issue create --title "Add PDF parsing and visualization" --body "Implement PDF parsing with preview and data extraction" --label "timeframe:long-term,type:feature" --milestone "Beta Release"
gh issue create --title "Set up user authentication system" --body "Implement secure user authentication and session management" --label "timeframe:long-term,type:security" --milestone "1.0 Release"

echo "Setup complete! 🎉" 