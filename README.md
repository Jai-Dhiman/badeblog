# Badeblog

A Blog platform for my grandfather in India to publish his life stories, articles and other works.

## About The Project

This project is a web application built with [Nuxt.js](https://nuxt.com/), a progressive framework for building modern web applications with Vue.js. It is designed to be a personal blog platform, allowing a user to publish various forms of written work, including articles, short stories, poems, and plays.

The application provides a clean and simple interface for both reading and managing the content. It includes user authentication, allowing the author to securely log in and manage their posts. A rich text editor is integrated for a seamless writing experience.

### Built With

*   [Nuxt.js](https://nuxt.com/)
*   [Vue.js](https://vuejs.org/)
*   [Pinia](https://pinia.vuejs.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Supabase](https://supabase.io/)
*   [Cloudflare Pages](https://pages.cloudflare.com/)

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
*   [bun](https://bun.sh/)

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username/badeblog.git
    ```
2.  Install BUN packages
    ```sh
    bun install
    ```
3.  Set up your environment variables. You will need to create a `.env` file in the root of the project and add the following variables:
    ```
    SUPABASE_URL=YOUR_SUPABASE_URL
    SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```
4.  Start the development server
    ```sh
    bun run dev
    ```

## Usage

The application is straightforward to use. Once you have logged in, you can create new posts, edit existing ones, and manage your drafts. The different categories of writing are organized into separate sections for easy navigation.

## Deployment

The application is configured for deployment on Cloudflare Pages. The `wrangler.toml` file and the deploy scripts in `package.json` are set up for this purpose.

To deploy the application, you can use the following commands:

*   `bun run deploy`: Deploy to the production environment.
