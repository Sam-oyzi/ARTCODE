# Art Code - 3D Models Platform

A Next.js application for managing and viewing 3D models with QR code assignments, user authentication, and admin features.

## Features

- 🎯 **3D Model Management**: Upload, view, and manage custom 3D models
- 🔐 **User Authentication**: Google OAuth integration with Firebase
- 📱 **QR Code Assignment**: Assign 3D models to QR codes with persistent storage
- 👨‍💼 **Admin Panel**: Manage users, models, and requests
- 🔄 **Real-time Updates**: Firebase integration for real-time data
- 🌐 **Google Drive Integration**: Seamless file storage and retrieval
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Firebase Auth with Google OAuth
- **Database**: Firestore
- **Storage**: Google Drive API
- **Deployment**: Vercel

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Drive API
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Google Service Account (Base64 encoded JSON)
GOOGLE_SERVICE_ACCOUNT_KEY=your_base64_encoded_service_account_json
```

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/art-code.git
   cd art-code
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase and Google API credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### 1. Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Art Code 3D Models Platform"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/art-code.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy with Vercel

1. Visit [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 3. Environment Variables Setup

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add all the environment variables from your `.env.local` file
3. Make sure to set them for **Production**, **Preview**, and **Development** environments

### 4. Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Google Drive Setup

### Folder Structure
Ensure your Google Drive has these folders:
- `ARTCODE_DATA/USER_3DOBJECT/` - For 3D model files
- `ARTCODE_DATA/USER_REQUEST/` - For user request images

### Service Account Setup
1. Create a Google Cloud Project
2. Enable Google Drive API
3. Create a Service Account
4. Download the JSON key
5. Base64 encode the JSON and set as `GOOGLE_SERVICE_ACCOUNT_KEY`
6. Share your Google Drive folders with the service account email

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication with Google provider
3. Create a Firestore database
4. Add your domain to authorized domains
5. Copy configuration to environment variables

## Admin Access

Add admin emails to the `ADMIN_EMAILS` array in:
- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/requests/page.tsx`
- `src/app/admin/models/page.tsx`

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── admin/          # Admin panel pages
│   ├── dashboard/      # User dashboard
│   ├── models/         # 3D models management
│   ├── profile/        # User profile with model carousel
│   └── login/          # Authentication pages
├── components/         # Reusable React components
│   └── ui/            # shadcn/ui components
├── context/           # React context providers
├── hooks/             # Custom React hooks
└── lib/               # Utility functions and configurations
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email your-email@example.com or create an issue on GitHub.
