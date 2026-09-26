# Deployment Diagram update

## Reference-inspired structure

- One User Devices container holds five role rows covering all six roles. Each row retains desktop and mobile icons; Circuit Staff and Physics Staff share one row, not one account or laboratory scope.
- One shared Web Browser execution environment contains the Frontend artifact: Next.js, React, TypeScript and Tailwind CSS.
- HTTPS connects browser clients to one Node.js application server. Its runtime contains the Backend artifact; nine service components remain grouped inside the same server, now arranged in wider two-column cards and one full-width reporting card.
- The components cover accounts, reservations/approvals, schedules/availability, equipment inventory, borrowing/returns, clearance/daily tasks/disposal, usage logs/end-term reporting, and the AI Chatbot/Forecasting gateways.
- One TLS path connects the application to PostgreSQL. There is no direct client-database connection.
- D1-D11 are read from the existing DFD Level 1 model and fit inside the Database Server, PostgreSQL environment and schema artifact. These are logical data stores, not eleven separate databases or the physical ERD table count.
- A new proposed AI Services node contains an AI Service Runtime and folded RAG chatbot / Inventory Forecasting artifacts. HTTPS/REST connects it only to the Backend. The user-device and database containers are more compact so the AI block fits without hiding D11.
- RAG uses approved D8 knowledge and live D4 inventory retrieved through the Backend. Its proposed prototype model is Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`), provided by Google through the Gemini API Free Tier. The artifact names that API dependency; the model is not installed on the laboratory server. Retrieval/index details remain pending, and no vector database or new ERD table is added.
- The Free Tier is quota-limited, not unlimited or guaranteed production hosting. Unpaid service inputs/responses may be used for product improvement. Personal, sensitive and confidential records are excluded; only approved non-sensitive context and permitted inventory fields may be sent. API keys must stay server-side. No key, provider account, billing or live connection is created here.
- Python/XGBoost is a proposed forecasting option, subject to training and validation using sufficient actual records. n8n is labeled optional workflow automation, not an alternative forecasting model. Both can be used together if approved for development.
- Figure 19 uses the updated artwork in Docs.html, with a larger 230 mm maximum image height and its existing caption and section number.
- The complete supplement retains 12 portrait A4 pages; the standalone deployment remains one portrait A4 page. Other diagram models and workflows are unchanged.

## Preserved boundaries

The reference supplies layout conventions. Its Vercel, MySQL, RunPod, Llama and AMSI labels are not copied. The AI Services node and its Google Gemini model/provider labels are added at the user's request. Application hosting remains undecided. The node represents a logical service boundary, not a claim that a dedicated physical or GPU server has been selected. Backend gateways retain authorization and controlled database retrieval. Forecasts estimate consumable consumption or simultaneous reusable-equipment demand and do not automatically change inventory or create purchases. No training accuracy, production deployment or sufficient dataset is claimed. Existing approval rules, roles, database relationships and functional requirements are unchanged.

## Sources and verification

- Docs.html, Deployment Diagram section: proposed Next.js/React/TypeScript, Node.js, PostgreSQL, HTTPS/TLS, RAG and Backend-controlled AI data access.
- [n8n](https://n8n.io/): workflow automation and model/API integration, not a forecasting algorithm.
- [XGBoost documentation](https://xgboost.readthedocs.io/en/stable/): gradient-boosted-tree machine learning library; the project still needs training data and validation.
- [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite): stable model code, text output and function-calling capabilities.
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing): Free Tier input/output availability for the selected model; this does not make hosting or all auxiliary services free.
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits): active project quotas must be checked in Google AI Studio; no fixed request count is promised here.
- [Gemini API terms](https://ai.google.dev/gemini-api/terms): unpaid-service data use and exclusion of sensitive, confidential or personal information.
- System/package.json and System/README.md: Tailwind CSS is part of the local Frontend structure. Demo application behavior does not prove production persistence.
- assets/figures-v2/dfd-level1/dfd-level1-model.json: eleven logical stores, including separate Laboratory Schedule and Laboratory Usage Logs.
- assets/system-diagrams/deployment.js: isolated deployment renderer and measured layout metadata.
- Run `node integrations/system-diagrams/export-deployment.cjs --check-only` for read-only geometry and content checks.
- Run `node integrations/system-diagrams/export-deployment.cjs --pdf-preview --docs` to refresh only deployment artwork and the combined PDF, render actual PDFs, and check Figure 19 in Docs. Playwright and Edge are required.

## Outputs

- System-Diagrams.html#deployment and assets/system-diagrams/deployment.png/.svg/.pdf.
- output/pdf/deployment.pdf and output/pdf/diagrams.pdf, mirrored by the website assets.
- Docs.html Figure 19 uses the same deployment.png asset.

No remote document, database, hosting deployment, Git commit or push is performed.
