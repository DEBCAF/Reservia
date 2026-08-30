# Reservini

Personal booking app for hangout purposes. It is currently coded to me, so you can also rewrite it to fit your own booking workflow.

Therefore, you should not be able to experience the app from my Vercel link, feel free to clone the repo and deploy it on yours to try!

## Features

- Exclusivity as only whitelisted usernames can access
- Able to book a time slot on any present or future day up to 2 years in advance
- Email notifications can be set up via Resend

## What you can do to personalise this website

- Change the header and other instances where it shows my username to your name/company
- Add your own API keys to your own .env.local and ensure they are updated accordingly on your Vercel interface

## Technology Stack

- Node.js backend
- Supabase database
- Vercel app deployment
- Resend email notifications

## Prerequisites

Ensure you have the following installed:
- Node.js >= 18.0.0
- npm >= 9.0.0

## Installation

1. Clone the repository
2. Install dependencies
3. Run development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result
