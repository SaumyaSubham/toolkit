# Toolkit

Toolkit is a comprehensive web application that provides a suite of useful tools for content creators, writers, and developers. It includes features such as a plagiarism detector, file comparison tool, and SEO optimizer.

## Features

- **Plagiarism Detector**: Check text or uploaded files for potential plagiarism.
- **File Comparison**: Compare the content of two files and get a similarity score.
- **SEO Optimizer**: Extract key SEO keywords from given text to optimize content.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Flask, Python
- APIs: TextRazor for SEO keyword extraction

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python (v3.7 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/toolkit.git
   cd toolkit
   ```

2. Set up the frontend:
   ```
   cd frontend
   npm install
   ```

3. Set up the backend:
   ```
   cd ../backend
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Create a `.env.local` file in the frontend directory
   - Create a `.env` file in the backend directory
   - Add necessary environment variables (e.g., API keys)

### Running the Application

1. Start the backend server:
   ```
   cd backend
   python app.py
   ```

2. In a new terminal, start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
