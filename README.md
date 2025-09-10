# TaskHive – Team Task Management (SaaS Demo) 🐝

![Node](https://img.shields.io/badge/Node.js-Express-green)
![Stripe](https://img.shields.io/badge/Stripe-Checkout-purple)
![CI](https://github.com/YOURUSER/taskhive-saas/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A **job-ready SaaS clone**: Auth, teams, tasks (Kanban style if you add a UI), and **Stripe subscription checkout**.

## 🔧 Quick Start (API)
```bash
cd api
cp .env.example .env # add MONGO_URI, JWT_SECRET, STRIPE keys
npm ci
npm run dev
