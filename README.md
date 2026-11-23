# 🛡️ NetGuard AI
### AI-Powered Network Attack Forecasting Dashboard for IoT Environments

<p align="center">
  <strong>Network Visibility · Threat Monitoring · Explainable Security Analytics</strong>
</p>

<p align="center">
  <a href="https://github.com/Sm-m15/netguard-ai"><img src="https://img.shields.io/badge/GitHub-Repository-181717?logo=github" alt="GitHub"></a>
  <img src="https://img.shields.io/badge/Next.js-13.5-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Recharts-2-8884d8" alt="Recharts">
</p>

---

## 🌐 Live Demo

**[Open NetGuard AI – Login Page](https://symmetrical-space-memory-69jg6vg5j57q246x6-3000.app.github.dev/login)**

> ⚠️ **Development preview only:** This is a GitHub Codespaces forwarded-port URL. It is not a permanent public deployment and may stop working when the Codespace stops or expires. Replace it with the permanent hosting URL after deployment.

**Repository:** [github.com/Sm-m15/netguard-ai](https://github.com/Sm-m15/netguard-ai)

---

## 📌 About the Project

NetGuard AI is a web-based network security monitoring and analytics dashboard designed around IoT network environments. It brings traffic inspection, threat alerts, attack-category analysis, forecasting visualizations and prediction explanations into one interface.

The project demonstrates how network-flow information and security indicators can be organized to help an analyst explore suspicious activity, review alerts and understand the factors associated with a risk assessment.

**Implementation note:** The current repository contains a front-end demonstration with deterministic, programmatically generated sample traffic and alert data in the application data service. Model-version metrics and prediction views are demo data; they should not be interpreted as independently measured results from a deployed or trained machine-learning model. Real-world detection requires integration with a trained model and real network telemetry.

## 🎯 Project Objectives

- Provide a unified interface for exploring IoT network traffic.
- Make suspicious flows easier to filter, inspect and investigate.
- Organize potential threats into understandable attack categories and severity levels.
- Visualize traffic patterns, risk indicators and forecast-oriented trends.
- Explain prediction factors in a human-readable format.
- Provide a foundation for integrating trained detection models and real network data.

## ✨ Key Features

| Module | What it provides |
|---|---|
| **Dashboard** | High-level network activity and risk overview |
| **Traffic Explorer** | Search, filter and inspect network flows |
| **CSV Upload & Validation** | Upload traffic CSV files and review schema and quality checks |
| **Alerts** | Review, filter and manage security alerts |
| **Forecast** | Visualize risk trends and forecast-oriented information |
| **Explainability** | Inspect feature-contribution information associated with a prediction |
| **Reports** | Access report-oriented views |
| **Settings** | Application configuration interface |
| **Role-based Demo Access** | Admin and Analyst interface roles |

## 🧭 Application Workflow

~~~mermaid
flowchart TD
    A[User opens NetGuard AI] --> B[Login]
    B --> C[Dashboard]
    C --> D[Traffic Explorer]
    D --> E[Inspect sample flows]
    D --> F[Upload CSV]
    F --> G[Validate columns and data quality]
    E --> H[Review risk and attack labels]
    G --> H
    H --> I[Alerts and investigation]
    H --> J[Forecast visualizations]
    H --> K[Prediction explanation]
    I --> L[Reports and review]
    J --> L
    K --> L
~~~

## 🏗️ System Architecture

~~~mermaid
flowchart TB
    U[User / Security Analyst] --> UI[Next.js + React Interface]
    UI --> AUTH[Demo Authentication and Role Context]
    UI --> PAGES[Dashboard Modules]
    PAGES --> TRAFFIC[Traffic Explorer]
    PAGES --> ALERTS[Alert Management]
    PAGES --> FORECAST[Forecast Views]
    PAGES --> EXPLAIN[Explanation Views]
    TRAFFIC --> API[Application Data Services]
    ALERTS --> API
    FORECAST --> API
    EXPLAIN --> API
    API --> SAMPLE[Deterministic Sample Data and Demo Logic]
    API --> VALIDATE[CSV Validation]
    SAMPLE --> CHARTS[Recharts Visualizations]
    VALIDATE --> TRAFFIC
~~~

**Architecture clarification:** Dashboard data services are implemented in the repository's application data layer and generate sample data. Supabase is listed as a dependency, but the presence of the package alone does not mean production authentication or a persistent database is configured. This diagram describes the current demo flow, not a live network sensor or production ML serving pipeline.

## 🧠 Data Analysis & Detection Workflow

The interface is organized around a typical network-flow analysis process:

1. **Data input:** Explore built-in sample network flows or upload a CSV file.
2. **Validation:** Check required columns and inspect missing, duplicate or invalid values.
3. **Feature inspection:** Review flow attributes such as protocol, ports, duration, bytes, packets and connection state.
4. **Risk and category review:** Inspect the risk score, anomaly indicator and associated attack label displayed by the demo.
5. **Investigation:** Review alert severity, source and destination information, evidence and suggested response actions.
6. **Explanation:** View feature-contribution information associated with a displayed prediction.
7. **Visualization:** Explore traffic and risk trends through dashboard charts.

### Attack categories represented in the demo

- Network Scanning
- Flood / Denial of Service
- Brute Force
- Botnet / DDoS
- MITM / Spoofing
- MQTT Suspicious Activity
- IoT Device Attack
- Normal traffic

### Conceptual machine-learning pipeline

The following is a reference pipeline for a future or separately integrated trained model. It is **not a claim that model training is implemented in this repository**.

~~~mermaid
flowchart LR
    A[Network Flow Records] --> B[Data Cleaning]
    B --> C[Feature Engineering]
    C --> D[Trained Classifier]
    D --> E[Attack Category]
    D --> F[Risk / Confidence]
    D --> G[Feature Explanation]
    E --> H[Analyst Dashboard]
    F --> H
    G --> H
~~~

A production implementation could evaluate tree-based classifiers such as Random Forest, XGBoost or LightGBM on a documented dataset. The selected algorithm, training configuration and evaluation results must be added only after the model is actually trained and tested.

## 📊 Dashboard Visualizations

The application uses **Recharts** for interactive data visualization. Depending on the module and displayed data, the dashboard includes visual summaries such as:

- Network traffic trends over time.
- Normal and suspicious traffic comparisons.
- Attack-category distribution.
- Protocol distribution.
- Risk trend and forecast-oriented charts.
- Risk gauges and severity indicators.

> Charts currently visualize the application's demo data. They are not evidence of real-time monitoring or validated model performance.

## 🧰 Technology Stack

| Technology | Role |
|---|---|
| [Next.js 13](https://nextjs.org/docs) | React application framework |
| [React 18](https://react.dev/) | Component-based user interface |
| [TypeScript](https://www.typescriptlang.org/docs/) | Typed application code |
| [Tailwind CSS](https://tailwindcss.com/docs) | Styling and responsive layouts |
| [Recharts](https://recharts.org/) | Charts and data visualization |
| [Radix UI](https://www.radix-ui.com/) | Accessible UI primitives |
| [Lucide React](https://lucide.dev/) | Icons |
| [Supabase JS](https://supabase.com/docs/reference/javascript/introduction) | Dependency available for backend integration |
| [Netlify](https://docs.netlify.com/) | Deployment configuration included in repository |

## 📁 Project Structure

~~~text
netguard-ai/
├── app/
│   ├── alerts/          # Alert management page
│   ├── dashboard/       # Main dashboard
│   ├── explain/         # Prediction explanation view
│   ├── forecast/        # Forecast visualizations
│   ├── login/           # Login page
│   ├── reports/         # Reports page
│   ├── settings/        # Settings page
│   ├── traffic/         # Traffic explorer and CSV upload
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # Reusable UI components
│   ├── app-shell.tsx
│   ├── chart-card.tsx
│   ├── kpi-card.tsx
│   ├── risk-gauge.tsx
│   ├── severity-badge.tsx
│   ├── sidebar.tsx
│   └── topbar.tsx
├── hooks/               # Reusable React hooks
├── lib/
│   ├── api.ts           # Demo data services and CSV logic
│   ├── types.ts         # TypeScript data models
│   └── utils.ts
├── netlify.toml
├── package.json
└── README.md
~~~

## 💻 Run Locally

### Prerequisites

- Node.js compatible with the Next.js version in this project
- npm
- Git

### 1. Clone the repository

~~~bash
git clone https://github.com/Sm-m15/netguard-ai.git
cd netguard-ai
~~~

### 2. Install dependencies

~~~bash
npm install
~~~

### 3. Start the development server

~~~bash
npm run dev
~~~

### 4. Open the application

Visit [http://localhost:3000](http://localhost:3000). The login page is available at the /login route.

### Available scripts

| Command | Description |
|---|---|
| npm run dev | Start local development |
| npm run build | Create a production build |
| npm run start | Start the production server |
| npm run typecheck | Run TypeScript type checking |
| npm run lint | Run the configured lint command |

## 🚀 Deployment

A netlify.toml file is present in the repository and configures a Next.js build using the Netlify Next.js plugin.

1. Sign in to [Netlify](https://www.netlify.com/) with GitHub.
2. Choose **Add new project → Import an existing project**.
3. Select **Sm-m15/netguard-ai**.
4. Review the build settings from netlify.toml.
5. Add any environment variables required by the code, if applicable.
6. Deploy and verify the login and application routes.
7. Replace the temporary Codespaces URL at the top of this README with the public deployment URL.

A public deployment remains available independently of a running Codespace, subject to the hosting provider's account, deployment and usage conditions.

## 🔐 Security & Limitations

- The login page labels the current authentication as demo authentication; do not enter real or reused passwords.
- Sample IP addresses, user identities, traffic records and model metrics in the demo are illustrative.
- Do not connect this demonstration to a production network or rely on its predictions for security decisions without implementing and validating the complete detection pipeline.
- Keep API keys and secrets out of source control.
- A production version should use verified authentication, persistent storage, access controls, secure ingestion and a tested model-serving layer.

## 🔮 Future Scope

- Integrate live IoT network telemetry and network sensors.
- Connect a trained intrusion-detection model for actual inference.
- Add reproducible training and evaluation workflows.
- Evaluate precision, recall, F1-score, PR-AUC and false-alarm rate on a documented test set.
- Add explainability methods such as SHAP for model-level feature attribution.
- Introduce configurable real-time alerts and notification channels.
- Store investigation history and reports in a production database.
- Add deployment monitoring, audit logging and stronger role-based access control.

## 📚 References & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/learn)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/en-US/)
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Next.js Runtime](https://docs.netlify.com/frameworks/next-js/overview/)

---

<p align="center">
  <strong>NetGuard AI — Making IoT Network Security Easier to Monitor and Understand.</strong>
</p>
