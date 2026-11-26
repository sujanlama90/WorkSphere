# WorkSphere frontend

React and Vite frontend for the WorkSphere Django REST API.

## Run locally

1. Start the Django API from `config/` at `http://127.0.0.1:8000`.
2. Install frontend dependencies with `npm install` in this directory.
3. Optionally copy `.env.example` to `.env.local` and set `VITE_API_URL` to your API root. The default is `http://127.0.0.1:8000/api/`.
4. Run `npm run dev` in this directory and open the URL printed by Vite.

The Django server must allow the Vite development origin through its CORS settings. The frontend stores the SimpleJWT access and refresh tokens in local storage and sends the access token as a bearer token.

## Included areas

- Public landing page, registration, login, profile and password change
- Role-aware overview, navigation and user administration
- Client, project and project-request workflows
- Tasks, discussions, attachments and activity history
- Support tickets, replies and attachments
- Notifications, time tracking, CSV reports and audit log

## Validation

- `npm run lint`
- `npm run build`
