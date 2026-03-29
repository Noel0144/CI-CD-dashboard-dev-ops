# CI/CD Pipeline Dashboard

This is our DevOps project where we built a CI/CD monitoring dashboard that connects 
to the GitHub API and shows real-time data about pipeline runs, builds, deployments, 
and system health — all in one place with charts and tables.

---

## What We Built and Why

We wanted to build something that actually shows what is happening inside a GitHub 
repository's CI/CD pipeline — not just read about it theoretically. So we built a 
full dashboard where you can log in with your GitHub username, enter any repository, 
and instantly see all the workflow runs, deployments, build results, and health 
status pulled live from the GitHub API.

---

## Project Structure
```
CI-CD-Pipeline-DevOps-/
│
├── server.js               # Our Node.js backend — works as a proxy to GitHub API
├── package.json            # All our dependencies listed here
├── package-lock.json       # Auto-generated lock file
├── .gitignore              # Ignoring node_modules and .env
│
└── public/                 # All our frontend pages and scripts
    ├── index.html          # Home / Landing page
    ├── login.html          # Login page
    ├── fetch.html          # Page where we enter the repo to track
    ├── pipeline.html       # Main pipeline dashboard page
    ├── build.html          # Build stats page
    ├── deploy.html         # Deployments page
    ├── health.html         # System health page
    │
    ├── auth.js             # Script we wrote to protect dashboard pages
    ├── login.js            # Handles login button click and GitHub user validation
    ├── fetch.js            # Handles repo input and saves it to localStorage
    ├── pipeline.js         # Fetches and renders all pipeline run data
    ├── build.js            # Fetches and renders build statistics
    ├── deploy.js           # Fetches and renders deployment data
    ├── health.js           # Fetches health data and renders alerts
    └── style.css           # Our custom dark theme stylesheet

---

## Pages We Built and What Each One Does

### Home Page (`index.html`)
This is our landing page. It has a navbar with links to all the dashboard 
sections. If the user is logged in, we show their GitHub username and a 
Dashboard button. If not logged in, we show a Login button. We also added 
a hero section with an animation iframe we hosted separately.

### Login Page (`login.html` + `login.js`)
Here we take the user's GitHub username as input and hit the GitHub Users API 
to check if that account actually exists. If it does, we store the user object 
in `localStorage` and redirect them to the fetch page. If not, we show an 
appropriate error message.

### Fetch Repo Page (`fetch.html` + `fetch.js`)
On this page we let the user enter a GitHub repo — either as a full URL like 
`https://github.com/user/repo` or just `user/repo`. We parse the URL if needed, 
call the GitHub repos API to confirm it exists, and then save it to `localStorage` 
as `targetRepo`. All our dashboard pages read from this stored value to know 
which repo to pull data for.

### Pipeline Dashboard (`pipeline.html` + `pipeline.js`)
This is the main dashboard we built. We fetch the last 10 GitHub Actions workflow 
runs and for each one we also fetch all the jobs inside it — in parallel using 
`Promise.all()` so it loads faster. From this data we compute:
- How long each run took
- Which jobs failed and what their failure rate is
- The status of each run (Passed / Failed / Running)

We then render:
- KPI stat cards showing total runs, success rate, failed count, running count
- A donut chart showing the Passed / Failed / Running split
- A bar chart showing failure rate per stage/job
- Pipeline run cards showing each run with its branch, commit hash, who 
  triggered it, and a visual stage flow with arrows between steps
- A history table at the bottom with all run details

### Build Dashboard (`build.html` + `build.js`)
We fetch the last 15 workflow runs here and calculate build statistics like 
total builds, how many passed, how many failed, how many are running, and 
the average duration across all runs. We display this in KPI cards, a donut 
chart, a bar chart with per-build duration, and a table.

### Deploy Dashboard (`deploy.html` + `deploy.js`)
Here we use the GitHub Deployments API (different from Actions runs) to fetch 
deployment events. For each deployment we also fetch its status separately to 
get the latest state. We compute duration and convert the timestamp to a 
human-friendly format like "2h ago". If the repo has no deployments we fall 
back to showing sample data so the page still demonstrates what it would look like.

### Health Dashboard (`health.html` + `health.js`)
We built this page to show system health status. We fetch two real things from 
GitHub — the API rate limit (so we can show how many requests remain out of 5000) 
and open issues (which we treat as active alerts). If an issue has a "bug" label 
we mark it as critical, otherwise as a warning. The bar chart on this page uses 
static placeholder values for utilization since GitHub API doesn't give that kind 
of server metric data.

### Auth Guard (`auth.js`)
We wrote this shared script to protect all our dashboard pages. It runs on page 
load and checks if `githubUser` exists in `localStorage`. If it doesn't, it 
immediately redirects to the login page. It also has a `logout()` function 
that clears the stored data and sends the user back to home.

---

---

## How to Run This Project Locally

### What you need
- Node.js installed on your machine
- A GitHub Personal Access Token — you can generate one at 
  https://github.com/settings/tokens

### Steps

**1. Clone the repo**
```bash
git clone https://github.com/defxharsh/CI-CD-Pipeline-DevOps-.git
cd CI-CD-Pipeline-DevOps-
```

**2. Install all dependencies**
```bash
npm install
```

**3. Create a `.env` file in the root folder and add your token**
```
GITHUB_TOKEN=your_github_personal_access_token_here
```

**4. Start the backend server**
```bash
node server.js
```

**5. Open in your browser**
```
http://localhost:3000
```

**6. Log in and use the dashboard**
- Enter your GitHub username on the login page
- Enter any public repo (e.g. `defxharsh/CI-CD-Pipeline-DevOps-`) on the fetch page
- Navigate through Pipeline, Build, Deploy, and Health dashboards

---

## Environment Variables

| Variable | What it is |
|---|---|
| `GITHUB_TOKEN` | Our GitHub Personal Access Token — needs repo and workflow read permissions |
| `PORT` | Optional. Defaults to 3000 if not set |

---

## Packages We Installed
```json
{
  "express"  : "^5.2.1"   // We used this to create our backend server
  "axios"    : "^1.14.0"  // We used this to make HTTP calls from server to GitHub
  "cors"     : "^2.8.6"   // We added this so our browser can talk to our local server
  "dotenv"   : "^17.3.1"  // We used this to load our .env token into the app
}
```

---

## What We Learned Building This

- How to use the GitHub REST API to fetch Actions, Deployments, and Issues data
- How to render dynamic charts using Chart.js
- How to manage simple client-side auth using localStorage
- How CI/CD pipeline stages work and what metrics matter (duration, failure rate, success rate)

---
