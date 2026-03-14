To Name# AHP Alumni Portal — Deployment Guide

## Overview
This is a Next.js web app. It is free to host on Vercel and free to run (no per-user charges).
All data lives in your Airtable base. You need to complete the steps below **once**.

---

## Step 1 — Set up Airtable (10 min)

You need to add **3 new tables** to your Airtable base alongside the existing Alumni table.

### Table 1: `Auth`
Create a new table named exactly `Auth` with these fields:

| Field Name         | Field Type         |
|--------------------|--------------------|
| Email              | Email              |
| Password Hash      | Long text          |
| Role               | Single select (options: `alumni`, `admin`) |
| Alumni Record ID   | Single line text   |
| Name               | Single line text   |
| Must Change Password | Checkbox         |

### Table 2: `Messages`
Create a new table named exactly `Messages` with these fields:

| Field Name   | Field Type       |
|--------------|------------------|
| From Email   | Email            |
| From Name    | Single line text |
| To Email     | Email            |
| To Name      | Single line text |
| Subject      | Single line text |
| Body         | Long text        |
| Created At   | Single line text |
| Read         | Checkbox         |

### Table 3: `Events`
Create a new table named exactly `Events` with these fields:

| Field Name   | Field Type       |
|--------------|------------------|
| Title        | Single line text |
| Description  | Long text        |
| Event Date   | Date             |
| Location     | Single line text |
| Created By   | Email            |
| RSVP List    | Long text        |

---

## Step 2 — Create your admin account (5 min)

Before launching, you need to create your own admin account **directly in Airtable**.

1. Open the `Auth` table in Airtable
2. Create a new record:
   - **Email**: your email address
   - **Role**: `admin`
   - **Name**: your name
   - **Alumni Record ID**: open your record in the Alumni table → copy the record ID from the URL (looks like `recXXXXXXXXXXXXXX`)
   - **Password Hash**: paste this temporary hash → `$2a$12$K4u9X1VWjJzJT2mRgJvMGeRZp3Q0KPQCvFhA9.iGkCvVbO7/z7Qxi`
     - This hash corresponds to the password: **`ChangeMe123!`**
     - **You must change it after first login** (use Admin → Users → Reset Password)

---

## Step 3 — Upload the code to GitHub (5 min)

1. Go to [github.com](https://github.com) and sign in (or create a free account)
2. Click the **+** button → **New repository**
3. Name it `ahp-alumni-portal`, set it to **Private**, click **Create repository**
4. On the next page, click **uploading an existing file**
5. Drag the entire `ahp-alumni-portal` folder contents into the upload area
   - **Important**: Do NOT upload the `node_modules` folder (it doesn't exist yet anyway)
   - Do NOT upload `.env.local` — it contains your secrets (it is in `.gitignore` already)
6. Click **Commit changes**

---

## Step 4 — Deploy to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **Add New… → Project**
3. Find and select your `ahp-alumni-portal` repository, click **Import**
4. On the configuration screen, leave everything as default
5. Click **Environment Variables** and add these 4 variables:

| Name | Value |
|------|-------|
| `AIRTABLE_API_KEY` | your Airtable Personal Access Token (starts with `pat...`) |
| `AIRTABLE_BASE_ID` | your Base ID (starts with `app...`) |
| `NEXTAUTH_SECRET` | any long random string, e.g. `ahp-alumni-ohio-state-secret-2024-xK9p` |
| `NEXTAUTH_URL` | leave **blank** for now — Vercel sets this automatically |

6. Click **Deploy** — it will take about 2 minutes
7. Vercel gives you a URL like `https://ahp-alumni-portal.vercel.app` — that's your site!

---

## Step 5 — First login

1. Go to your Vercel URL
2. Log in with your email and password `ChangeMe123!`
3. Go to **Admin → Users** and reset your own password immediately
4. Start adding other alumni accounts from the same page

---

## Adding Alumni Accounts

From **Admin → Users → Add Account**:
1. Select the alumni from the dropdown (pulls from your Airtable Alumni table)
2. Their email auto-fills
3. Set a temporary password (you'll share this with them)
4. Click **Create Account**

Share the site URL and their temporary password with each alumnus.
They can then log in and edit their own profiles.

---

## Adding LinkedIn Field to Airtable (optional)

If you want LinkedIn profiles to appear on the website, add a field named exactly `LinkedIn` (Single line text) to your Alumni table in Airtable.

---

## Rotating your Airtable API Key

If you ever need to rotate your Airtable token:
1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens) and create a new one
2. Go to your Vercel project → Settings → Environment Variables
3. Update `AIRTABLE_API_KEY` with the new token
4. Vercel will redeploy automatically

---

## Troubleshooting

**Login not working** → Double-check the `Auth` table exists and has your record with a valid password hash and role = `admin`.

**Alumni not showing** → Confirm your `AIRTABLE_BASE_ID` starts with `app` and the table is named exactly `Alumni`.

**Profile photos not loading** → This is expected until Airtable generates permanent URLs. Try refreshing after a moment.

**Site looks broken after deploy** → Check Vercel's deployment logs for errors (Vercel dashboard → your project → Deployments).
