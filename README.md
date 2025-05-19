
# Firebase Studio - Telebounties App

This is a NextJS starter in Firebase Studio for the Telebounties application.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

2.  **Set Up Firebase Environment Variables**:
    *   Rename the `placeholder.env.local` file in the root directory to `.env.local`.
    *   Open `.env.local` and replace the placeholder values with your actual Firebase project credentials. You can find these in your Firebase project settings.
        ```
        NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
        NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
        ```
    *   **Important**: Ensure these variables are prefixed with `NEXT_PUBLIC_` to be accessible on the client-side.
    *   The `.env.local` file is already added to `.gitignore` to prevent committing your API keys.

3.  **Run the Development Server**:
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    The application will be available at [http://localhost:9004](http://localhost:9004). Note: The port was updated to 9004 as per previous changes. If it was 9002, adjust accordingly.

4.  **Explore the App**:
    *   The main application pages are located in `src/app/`.
    *   Key components can be found in `src/components/`.
    *   Firebase configuration is in `src/lib/firebase/config.js`.
    *   Authentication context is managed in `src/contexts/auth-context.jsx`.

## Core Features:

- Task List: Display available tasks: Create Meme, Upload Tweet, Share Blog, Polls and Quizzes, and create short videos
- Task Submission: Display task details and submission form (file upload and caption).
- User Profile: Display user profile with HTR balance and submission history.
- Settings: Theme toggle, password update, logout, and account deletion.
- Admin Review: An admin-only page to review, approve, or reject task submissions and award HTR.

