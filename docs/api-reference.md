# insideTUM API Reference (Hackathon)

Base URL: `http://localhost:4000` (override per environment)

All authenticated routes require `Authorization: Bearer <JWT>`.

## Auth
- `POST /auth/mock-login`
  - Body: `{ email: string, fullName: string, tumId?: string, faculty?: "CIT" | "SOM" }`
  - Response: `{ token, user }`
- `GET /me`
  - Response: `{ user }`

## Health & Info
- `GET /api/health` → `{ status, message }`
- `GET /api/tum-events` → `{ source, count, events: [{ title, date?, url?, image?, category? }] }`
- `GET /api/mensa` → `{ date?, items: [{ name, side?, price?, type?, date? }] }`

## Students
- `GET /students`
  - Response: `{ users: [{ id, fullName, email, faculty }] }`

## Forum
- `GET /forum/posts?category=market|qa|discussion`
  - Response: `{ posts: [{ id, title, body, category, createdAt, author, commentsCount }] }`
- `POST /forum/posts`
  - Body: `{ title: string, body: string, category: "market" | "qa" | "discussion" }`
  - Response: `{ post }`
- `GET /forum/posts/:id`
  - Response: `{ post: { ... , comments: [{ id, body, createdAt, author }] } }`
- `POST /forum/posts/:id/comments`
  - Body: `{ body: string }`
  - Response: `{ comment }`

## Meetups
- `GET /meetups?category=hike|bike|food|code|study|social`
  - Response: `{ meetups: [{ id, title, description, category, timeInfo, location, maxAttendees, host, memberCount, joined, isHost }] }`
- `POST /meetups`
  - Body: `{ title, description, category, timeInfo, location, maxAttendees? }`
  - Response: `{ meetup }`
- `POST /meetups/:id/join` → `{ status: "joined" }`
- `POST /meetups/:id/leave` → `{ status: "left" }`
- `PUT /meetups/:id` (host only)
  - Body: any subset of `{ title, description, category, timeInfo, location, maxAttendees }`
  - Response: `{ meetup }`

## Chats & Messages
- `GET /chats`
  - Response: `{ chats: [{ id, members: [{ id, fullName, email }], lastMessage? }] }`
- `POST /chats`
  - Body: `{ participantId: string }`
  - Response: `{ chat }`
- `GET /chats/:id/messages`
  - Response: `{ messages: [{ id, body, createdAt, sender: { id, fullName, email } }] }`
- `POST /chats/:id/messages`
  - Body: `{ body: string }`
  - Response: `{ message: { id, body, createdAt, senderId } }`

## Legacy Scraper (kept for testing)
- `POST /api/scrape` → `{ title?, description?, ogTitle?, ogDescription?, ogImage?, textPreview?, headings[], links[] }`
- `POST /api/crawl` → `{ url: string, maxPages?, maxDepth?, sameDomain? }`
