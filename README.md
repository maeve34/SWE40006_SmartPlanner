# SWE40006_SmartPlanner

![Backend CI](https://github.com/maeve34/SWE40006_SmartPlanner/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/maeve34/SWE40006_SmartPlanner/actions/workflows/frontend-ci.yml/badge.svg)

To run frontend of the app (Vue):
1. cd smartplanner-src
2. npm install
3. cp .env.example .env
4. npm run build
5. npm run dev

To run backend of the app (Node.js + Express.js):
1. cd backend
2. npm install
3. cp .env.example .env
4. node server.js

To build the Docker images:
<!-- Frontend -->
1. cd frontend
2. docker build -t smartplanner-frontend .
3. docker run -p 80:80 smartplanner-frontend

<!-- Backend -->
4. cd backend
5. docker build -t smartplanner-backend .
6. docker run --env-file .env -p 3000:3000 smartplanner-backend



