# Na Winie (Grab & Cook)

A web application that helps you turn your leftover ingredients into delicious meals. Built with Astro, React, TypeScript, and FastAPI.

## Features

- Suggest recipes based on available ingredients
- Interactive ingredient management
- User authentication and recipe saving
- Recipe filtering by difficulty and ingredient count
- Recipe rating system

## Tech Stack

### Frontend
- Astro 5
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui

### Backend
- Python/FastAPI
- SQLAlchemy
- SQLite (development) / PostgreSQL (production)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nawinie.git
cd nawinie
```

2. Install frontend dependencies:
```bash
pnpm install
```

3. Install backend dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory:
```env
DATABASE_URL=sqlite:///./nawinie.db
JWT_SECRET=your-secret-key
```

### Development

1. Start the frontend development server:
```bash
pnpm dev
```

2. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Testing

### Frontend Tests
```bash
pnpm test
```

### Backend Tests
```bash
cd backend
pytest
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
