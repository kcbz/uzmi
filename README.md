# Media Search Application

## Overview
A web-based media search and download interface using Google Custom Search API. This application allows users to search for images and videos, view results, and download them directly.

## Prerequisites
- Node.js and npm installed
- Google Custom Search API credentials:
  - Google API Key
  - Custom Search Engine ID

## Setup Instructions
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Google API credentials:
     ```
     GOOGLE_API_KEY=your_api_key_here
     SEARCH_ENGINE_ID=your_search_engine_id_here
     ```

## Running the Application
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:4000`

## Usage
1. Enter your search term in the search bar
2. Select media type (Images, Videos, or Both)
3. Choose the number of results (1-20)
4. Click Search to view results
5. Use individual download buttons or select multiple items for batch download

## Notes
- Image downloads work directly
- Video downloads support various formats including YouTube videos
- Maximum 20 results per search
- Supports both single and batch downloads
