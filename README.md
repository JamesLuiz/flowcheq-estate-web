# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/02f3ea16-b7f2-46f2-970b-c5be65bd3af4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/02f3ea16-b7f2-46f2-970b-c5be65bd3af4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Development Setup

### Environment Configuration

The frontend automatically uses `http://localhost:3000` as the API URL when running in development mode (`npm run dev`). This ensures you're always testing against your local backend server.

**To override the API URL:**

1. Create a `.env.local` file in the root directory (this file is gitignored)
2. Add the following:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

**For production builds:**
- Set `VITE_API_URL` in your deployment platform's environment variables
- If not set, it will default to `http://localhost:3000`

### Running Locally

1. **Start the backend server:**
   ```sh
   cd backend
   npm install
   npm run start:dev  # or your backend start command
   ```

2. **Start the frontend:**
   ```sh
   npm install
   npm run dev
   ```

The frontend will automatically connect to `http://localhost:3000` when running in development mode.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/02f3ea16-b7f2-46f2-970b-c5be65bd3af4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
