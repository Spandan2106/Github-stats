# GitHub Stats SVG Generator

A simple and customizable API to generate SVG cards for your GitHub statistics, ready to be deployed on Vercel.

![Stats Card](https://your-vercel-url.vercel.app/api/stats?username=your-github-username)
![Languages Card](https://your-vercel-url.vercel.app/api/langs?username=your-github-username)

## Features

*   **Stats Card**: Shows followers, public repos, total stars, and company.
*   **Top Languages Card**: Displays a user's most used languages.
*   **Contribution Grid**: A visual grid of your contributions over the last year.
*   **Animated Snake**: A fun animation that traces your contribution history.
*   **Customizable Themes**: Comes with `dark`, `light`, and `simple` themes.

## API Endpoints

Replace `your-vercel-url.vercel.app` with your deployment URL and `your-github-username` with a GitHub username.

*   **Stats Card**
    ```
    https://your-vercel-url.vercel.app/api/stats?username=your-github-username
    ```
*   **Top Languages**
    ```
    https://your-vercel-url.vercel.app/api/langs?username=your-github-username
    ```
*   **Contribution Grid**
    ```
    https://your-vercel-url.vercel.app/api/contrib?username=your-github-username
    ```
*   **Contribution Snake**
    ```
    https://your-vercel-url.vercel.app/api/snake?username=your-github-username
    ```

### Query Parameters

*   `username` (required): The GitHub username to fetch stats for.
*   `theme`: The theme for the card. Options are `dark`, `light`, `simple`. Defaults to `dark`.

## Project Structure

The project is organized as a simple Node.js application.

```
github-stats/
├── index.js          # Express server and SVG rendering logic
├── github.js         # Functions to fetch data from GitHub API
├── package.json      # Project dependencies and scripts
├── vercel.json       # Vercel deployment configuration
├── README.md         # This file
└── LICENSE           # Project license
```

## Setup and Local Development

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd github-stats
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add your GitHub Personal Access Token to avoid rate limiting.
    ```
    GITHUB_TOKEN=your_github_token_here
    PORT=3000
    ```

4.  **Run the server:**
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:3000`.

## Deployment

This project is ready to be deployed on Vercel.

1.  Push your code to a GitHub repository.
2.  Import the repository on Vercel.
3.  Add `GITHUB_TOKEN` as an environment variable in the Vercel project settings.
4.  Deploy!

## License

This project is licensed under the MIT License. See the LICENSE file for details.