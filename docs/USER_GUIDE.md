# NexQA Clarity Platform - User Guide

Welcome to the NexQA Clarity Platform! This guide explains how to use the core features of our Test Management Platform.

## 1. Requirement Management

Requirements are the foundation of your testing process.

### Creating a Requirement
1. Navigate to the **Requirements** module from the sidebar.
2. Click **Create Requirement**.
3. Fill in the Title, Description, and Acceptance Criteria.
4. Set the Priority, Module, and Type.
5. Click **Submit**.

### AI Requirement Analysis
The platform can automatically analyze your requirements for completeness and clarity.
1. Open a Requirement detail page.
2. In the right sidebar, locate the **AI Analysis** panel.
3. Click **Analyze**.
4. Review the Quality Score and actionable suggestions.

## 2. Test Case Generation

NexQA can automatically generate test cases based on your requirements.
1. Ensure your requirement has a detailed Description and Acceptance Criteria.
2. In the Requirement detail page, find the **Test Cases** section.
3. Click **Generate Test Cases** (Magic Wand icon).
4. Review the AI-generated scenarios (Happy path, Edge cases, etc.).
5. Accept the ones you want to keep.

## 3. Test Execution

### Scheduled Runs
1. Navigate to **Test Runs**.
2. Click **Create Schedule**.
3. Define the Cron expression, Environment, and Test Filter.
4. The system will automatically trigger tests at the scheduled time.

### Defect Root Cause Analysis
When tests fail, NexQA's AI helps identify the root cause:
1. Open a reported Defect.
2. The AI will automatically categorize it (e.g., UI, API, Data, Auth).
3. Review the confidence score and prevention suggestions.

## 4. CI/CD Integration

NexQA integrates seamlessly with GitHub and GitLab.
1. Navigate to **Settings** -> **Integrations**.
2. Copy your Webhook URL and Secret.
3. In your repository settings, add the Webhook URL.
4. Pushes to `main` will automatically trigger smoke tests.
5. Pull Requests will trigger regression tests.

---
*For further assistance, please contact your platform administrator.*
