# NexQA Enterprise Intelligence Platform
## User Guide (Phase 5)

Welcome to the Enterprise Intelligence Platform. This release brings cross-project visibility, predictive forecasting, and automated compliance tracking to NexQA.

### 1. Portfolio Dashboard
Navigate to `/portfolio` to access the Enterprise Portfolio.
Here you can see:
- **Top Stats**: Quick glance at total projects, overall quality score, and projects at risk.
- **Active Projects**: Individual project cards displaying their Quality Score, total requirements, test cases, and open bugs.
- **Compliance Panel**: Overview of your organization's compliance score against industry standards (Documentation, Quality, Process, Security).
- **Resource Allocation**: Team utilization across the entire platform, highlighting any overloaded members and providing AI-driven recommendations.
- **Export Reports**: Downloadable Excel reports for Quality Metrics, Requirements, and Defects.

### 2. Predictive Analytics & Release Forecasting
The backend now supports forecasting your release readiness.
* **Endpoint**: `POST /api/v1/analytics/forecast`
* **Features**: Predicts the estimated ready date, current readiness score, and identifies risk factors and recommendations based on open defects and test coverage velocity.

### 3. Report Generation
The platform can now generate styled Excel reports.
* Use the **Export Reports** section on the Portfolio Dashboard.
* Automatically styles headers and exports your data in a ready-to-share format.
* Current supported exports: Quality Metrics, Requirements, Defects Log.

### 4. Data Layer Notes (Hybrid Approach)
* **Real Data**: The Portfolio Dashboard uses real counts from the database (counting actual Requirements, Test Cases, and Defects per project).
* **Mock Data**: Compliance tracking and Resource Allocation currently use mock data representing our ideal end-state, to facilitate UI development. These will be wired to actual metrics in Phase 6.

Enjoy the new Enterprise capabilities!
