# Inkwell AI Writer

Inkwell is a sophisticated long-form writing environment designed for novelists and creative writers. It features AI-powered grammar refinement, intelligent text expansion with side-by-side previews, and a clean, distraction-free interface for managing books and chapters.

## Features

- **Distraction-Free Editor**: A beautiful WYSIWYG writing environment using serif typography optimized for long-form reading.
- **Book & Chapter Management**: Organize your work into multiple books and navigate through chapters via the integrated sidebar.
- **AI Grammar Refinement**: Improve your prose with Gemini-powered corrections that preserve your unique authorial voice and style.
- **Intelligent Text Expansion**: Stuck on a scene? Select a snippet and let Gemini suggest sensory details or internal monologues to expand your narrative.
- **Live Previews**: Compare AI suggestions with your original text before committing changes.
- **Automatic Word Counting**: Keep track of your progress with per-chapter word counts.

## Vercel Deployment Guide

Deploying Inkwell to Vercel is straightforward. Follow these steps to get your AI writing studio online:

### 1. Prerequisites
- A [Vercel](https://vercel.com/) account.
- A [Google AI Studio API Key](https://aistudio.google.com/app/apikey).

### 2. Deployment Steps

#### Via Vercel Dashboard (Recommended)
1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Import the project into Vercel.
3. In the **Environment Variables** section, add the following key:
   - `API_KEY`: Your Gemini API Key from Google AI Studio.
4. Click **Deploy**.

#### Via Vercel CLI
If you have the Vercel CLI installed, run:
```bash
vercel
```
When prompted for environment variables during or after the first deployment:
```bash
vercel env add API_KEY
```

### 3. Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_KEY` | Your Google Gemini API key used for grammar and expansion features. | **Yes** |
| `MONGODB_URI` | (Optional) Future-proofing for database integration. Current version uses `localStorage`. | No |

## Local Development

To run Inkwell locally:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   API_KEY=your_gemini_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **AI Engine**: Google Gemini (@google/genai)
- **Icons**: Font Awesome 6
- **Typography**: Inter (UI) and Lora (Editor)
