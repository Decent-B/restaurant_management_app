# Restaurant Management Application

A full-stack restaurant management system built with Django REST Framework (backend) and React + TypeScript (frontend), containerized with Docker.

## Architecture

- **Backend**: Django 5.1 + PostgreSQL 14
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Deployment**: Docker Compose with hot-reload during development

## Quick Start

```bash
# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Django Admin: http://localhost:8000/admin
```

## Features

- **Order Management**: Real-time order tracking with collapsible order views and quick status updates
  - Interactive status toggle: Staff can quickly switch orders between **Pending** → **Preparing** → **Ready** states
  - Color-coded status indicators:
    - **Pending** (Yellow): Order received, waiting to be prepared
    - **Preparing** (Blue): Kitchen is actively preparing the order  
    - **Ready** (Green): Order is ready for pickup/serving/delivery
    - **Completed** (Green badge): Order fulfilled and paid
    - **Cancelled** (Red badge): Order cancelled
- **Payment Processing**: Support for cash and online banking (QR code) payments
- **Menu Management**: CRUD operations for menus and menu items
- **User Authentication**: JWT-based auth for staff and customers
- **Analytics Dashboard**: Revenue and rating analytics
- **Reviews & Feedback**: Customer review system

## Development

### Backend (Django)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

## Important Notes

### Docker Volume Sync Issue with Media Files

When adding new files to the `backend/media/` directory while containers are running, Docker's `watch` sync feature may not automatically copy them into the backend container.

**Problem**: Files added to `backend/media/` on the host machine don't appear at `/app/media/` inside the container.

**Solution**: Use one of these methods:

1. **Copy file directly to container** (fastest):
   ```bash
   docker cp backend/media/demo_qr_code.webp restaurant_management_app-backend-1:/app/media/demo_qr_code.webp
   ```

2. **Restart backend service**:
   ```bash
   docker-compose restart backend
   ```

3. **Rebuild backend container** (if restart doesn't work):
   ```bash
   docker-compose down
   docker-compose up --build backend
   ```

**Why this happens**: Docker Compose's `develop.watch` feature syncs file changes but may not detect new files added after the container starts. This is a known behavior with bind mounts and watch synchronization.

### Media File Configuration

The backend serves media files (images, QR codes) at `/media/` endpoint:

- **Django Settings**: 
  - `MEDIA_URL = '/media/'`
  - `MEDIA_ROOT = BASE_DIR / 'media'` (host) → `/app/media` (container)
  
- **URL Configuration**: Media files are served via `static()` helper in `config/urls.py`

- **Frontend Access**: Use full URL `http://localhost:8000/media/filename.ext` when referencing media files

### Payment QR Code Images

The application supports mobile banking payments with QR code display:

1. Place QR code images in `backend/media/` directory
2. Update `orders/views.py` `process_payment()` to return the image path:
   ```python
   response_data["qr_code_image"] = "/media/demo_qr_code.webp"
   ```
3. **Important**: After adding the file, copy it to the container:
   ```bash
   docker cp backend/media/demo_qr_code.webp restaurant_management_app-backend-1:/app/media/
   ```
4. Verify accessibility: `curl -I http://localhost:8000/media/demo_qr_code.webp`

## API Endpoints

### Orders
- `GET /api/orders/kitchen/` - Get pending orders (Staff only)
- `POST /api/orders/pay/` - Process payment (CASH or ONLINE_BANKING)
- `POST /api/orders/payment/confirm/` - Confirm pending payment (Staff only)
- `PUT /api/orders/status/update/` - Update order status

### Authentication
- `POST /api/accounts/staff/login/` - Staff login (returns JWT)
- `POST /api/accounts/diner/login/` - Customer login (returns JWT)
- `POST /api/accounts/token/refresh/` - Refresh JWT token

### Menu
- `GET /api/menu/menus/` - List all menus
- `GET /api/menu/menu-items/` - List all menu items

## Troubleshooting

### Frontend not showing latest changes
```bash
docker-compose restart frontend
# If that doesn't work:
docker-compose build frontend --no-cache
```

### Backend media files not accessible
```bash
# Check if file exists in container
docker-compose exec backend ls -la /app/media/

# Copy file if missing
docker cp backend/media/yourfile.ext restaurant_management_app-backend-1:/app/media/

# Verify via HTTP
curl -I http://localhost:8000/media/yourfile.ext
```

### Database reset
```bash
docker-compose down -v  # Removes volumes
docker-compose up --build
```

## Project Structure

```
restaurant_management_app/
├── backend/
│   ├── accounts/          # User authentication & management
│   ├── analytics/         # Analytics and reporting
│   ├── config/            # Django settings & URLs
│   ├── media/             # Uploaded files & QR codes
│   ├── menu/              # Menu & menu items
│   ├── orders/            # Order & payment processing
│   └── reviews/           # Customer reviews
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client functions
│   │   ├── contexts/      # React contexts
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
└── docker-compose.yml
```

## Contributing

1. Create feature branch from `main`
2. Make changes with proper commit messages
3. Test locally with Docker
4. Submit pull request

## License

MIT
