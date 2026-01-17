# Nestin Estate

Nestin Estate is a modern property management application designed to streamline real estate operations. It allows users to browse properties, schedule viewings, and potentially make payments, while providing agents and administrators with tools to manage listings and viewings.

The project is built with a **React** frontend (using Vite) and a **NestJS** backend.

## 📂 Project Structure

The project is organized as a monorepo:

- **Root Directory**: Contains the **Frontend** application.
    - Built with [Vite](https://vitejs.dev/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/).
    - Handles the user interface, property browsing, and booking flows.
- **`/backend`**: Contains the **Backend** API.
    - Built with [NestJS](https://nestjs.com/) and [MongoDB](https://www.mongodb.com/).
    - Manages data, authentication, emails, and payments (Flutterwave).

## 🚀 Local Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (running locally or a cloud instance like MongoDB Atlas)

### 1. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend/` directory with the following variables:
    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/nestin-estate
    JWT_SECRET=your_jwt_secret_key
    FRONTEND_URL=http://localhost:5173

    # Payments (Flutterwave)
    FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
    FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
    FLUTTERWAVE_ENCRYPTION_KEY=...
    FLUTTERWAVE_WEBHOOK_URL=http://your-domain.com/api/webhooks/flutterwave

    # Media Uploads (Cloudinary)
    CLOUDINARY_CLOUD_NAME=...
    CLOUDINARY_API_KEY=...
    CLOUDINARY_API_SECRET=...

    # Email Service (SMTP)
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your_email@gmail.com
    SMTP_PASS=your_app_password
    SMTP_FROM="Nestin Estate <no-reply@nestinestate.com>"

    # Settings
    VIEWING_FEE_PERCENTAGE=10
    ```
4.  Start the development server:
    ```bash
    npm run start:dev
    ```

### 2. Frontend Setup
1.  Return to the root directory:
    ```bash
    cd ..
    # or open a new terminal in the project root
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env.local` file in the root directory:
    ```env
    VITE_API_URL=http://localhost:3000
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

The app should now be running at `http://localhost:5173`.

---

## 🌐 Deployment Guide

### Hosting on Hostinger (VPS)

For full control over both the Node.js backend and React frontend, a **VPS (Virtual Private Server)** is recommended.

1.  **Get a VPS**: Purchase a VPS plan (e.g., Ubuntu 22.04).
2.  **Connect**: SSH into your VPS.
    ```bash
    ssh root@<your-vps-ip>
    ```
3.  **Install Environment**:
    - Install Node.js & NPM: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs`
    - Install PM2 (Process Manager): `sudo npm install -g pm2`
    - Install Nginx (Web Server): `sudo apt install nginx`
    - Install Git: `sudo apt install git`
4.  **Clone Project**:
    ```bash
    git clone <your-repo-url>
    cd nestin-estate
    ```
5.  **Deploy Backend**:
    - `cd backend`
    - Create `.env` file with production values.
    - `npm install`
    - `npm run build`
    - Start with PM2: `pm2 start dist/main.js --name "nestin-backend"`
6.  **Deploy Frontend**:
    - Go to root: `cd ..`
    - Create `.env.local` with your domain API URL (e.g., `https://api.yourdomain.com`).
    - `npm install`
    - `npm run build` (This creates a `dist/` folder with static files).
7.  **Configure Nginx**:
    - Set up a reverse proxy to serve the frontend static files and proxy `/api` requests to localhost:3000.
    - Example config (`/etc/nginx/sites-available/default`):
      ```nginx
      server {
          listen 80;
          server_name yourdomain.com;

          location / {
              root /path/to/nestin-estate/dist;
              try_files $uri $uri/ /index.html;
          }

          location /api/ {
              proxy_pass http://localhost:3000;
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection 'upgrade';
              proxy_set_header Host $host;
              proxy_cache_bypass $http_upgrade;
          }
      }
      ```
    - Restart Nginx: `sudo systemctl restart nginx`

### Hosting on AWS (EC2)

Deploying on an **EC2 Instance** is very similar to the Hostinger VPS method and provides full flexibility.

1.  **Launch Instance**:
    - Go to AWS Console > EC2 > Launch Instance.
    - Choose **Ubuntu Server 24.04 LTS** (or 22.04).
    - Instance Type: `t2.micro` (free tier) or `t3.small` for better performance.
    - Key Pair: Create one to allow SSH access.
    - Security Group: Allow HTTP (80), HTTPS (443), and SSH (22).
2.  **Connect**:
    ```bash
    ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>
    ```
3.  **Install & Setup**:
    - Follow the **same steps 3-7** as the Hostinger guide above.
    - *Note*: Ensure you use the EC2 Public IP or your attached domain name in the Nginx config.
4.  **Database**:
    - Instead of installing MongoDB on the EC2 (which is possible but harder to manage), it is highly recommended to use **MongoDB Atlas** (cloud hosted) and simply put the connection string in your `.env`.

### Alternative AWS Method (Simpler)
- **Frontend**: Host the `dist` folder on **AWS S3** and serve with **CloudFront** (CDN) for fast global access.
- **Backend**: Deploy the backend code to **AWS App Runner** or **Elastic Beanstalk**, which manages the server environment for you.
