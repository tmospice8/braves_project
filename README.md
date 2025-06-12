## Getting Started

To get a local copy of the project up and running:

### 1. Clone the repository

git clone https://github.com/tmospice8/braves_project.git
cd braves_project

# App Structure

braves_project/
│
├── backend/ # Flask backend
│ ├── app.py
│ ├── routes.py
│ ├── utils/
│ │ └── data_loader.py
│ ├── BattedBallData.xlsx
│ └── requirements.txt
│
├── frontend/ # Vue.js frontend
│ ├── public/
│ ├── src/
│ │ ├── assets/
│ │ │ ├── headshot-icon.jpg
│ │ │ └── logo.png
│ │ ├── components/
│ │ │ ├── BattersPage.vue
│ │ │ ├── BattersPage.js
│ │ │ ├── GameActionsByDate.vue
│ │ │ ├── GameActionsByDate.js
│ │ │ ├── PitchersPage.vue
│ │ │ └── PitchersPage.js
│ │ ├── styles/
│ │ │ ├── filters.css
│ │ │ ├── page.css
│ │ │ ├── player-info.css
│ │ │ ├── table.css
│ │ │ └── video.css
│ │ ├── App.vue
│ │ ├── global.css
│ │ └── main.js
│ └── package.json
│
├── run.sh
└── README.md

## Prerequisites

Make sure you have the following installed:

- Python 3.8+
- Node.js v16+
- npm

## Running the application

# backend

cd backend
python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt

Once the backend is running, you can access the following API endpoints:

- [GET /api/batters](http://127.0.0.1:5000/api/batters)
- [GET /api/pitchers](http://127.0.0.1:5000/api/pitchers)
- [GET /api/games](http://127.0.0.1:5000/api/games)

# frontend

cd frontend
npm install
npm run serve

Once the frontend is running, the app will be available at:

- [http://localhost:8080](http://localhost:8080)
