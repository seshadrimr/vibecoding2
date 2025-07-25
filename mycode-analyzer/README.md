# MyCodeAnalyzer

A full-stack web application for automating and validating C# repositories on GitHub.

## Features

- Input GitHub repository URL and Personal Access Token (PAT)
- List all source code files in the repository, focusing on .cs files
- Use OpenAI to analyze and classify files as logic files or boilerplate files
- Display classification results in a table on the UI
- Generate NUnit test code for logic files
- Support running local unit tests without git for quick validation

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js/Express
- **APIs**: GitHub API, OpenAI API
- **Testing Framework**: NUnit

## Setup Instructions

### Prerequisites

- Node.js and npm
- GitHub account and Personal Access Token
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd mycode-analyzer/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd mycode-analyzer/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter your GitHub repository URL and Personal Access Token
2. Click "Analyze Repository" to fetch and analyze the C# files
3. View the classification results in the table
4. Generate and view NUnit tests for logic files
5. Run local unit tests for quick validation
