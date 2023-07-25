# Contributing

## Local development

1. Clone the repository using your preferred method:

   ```shell
   # HTTPS
   git clone https://github.com/lumen-notes/lumen.git

   # SSH
   git clone git@github.com:lumen-notes/lumen.git

   # GitHub CLI
   gh repo clone lumen-notes/lumen
   ```

1. Create a `.env.local` file in the root directory with the following variables:

   ```shell
   VITE_GITHUB_CLIENT_ID=30db9c210d682a9624e7
   GITHUB_CLIENT_SECRET=...
   ```

   > Note: Ask @colebemis for the `GITHUB_CLIENT_SECRET` value.

1. Install the dependencies:

   ```shell
   npm install
   ```

1. Start the development server:

   ```shell
   npm run dev:netlify
   ```

1. Open the app at http://localhost:8888.
