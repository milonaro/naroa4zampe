# Task 17 - ChatAIView Component

## Agent: Code Agent

## Task
Create `/home/z/my-project/src/components/ChatAIView.tsx` for the "Naro a 4 Zampe" app — an interactive AI assistant for animal regulations.

## Work Log

1. **Read project context**: Reviewed worklog.md, package.json, store.ts, page.tsx, HomeView.tsx, and existing API route `/api/chat-ai/route.ts` to understand the project patterns, available components, and API contract.

2. **Created ChatAIView.tsx** with all required features:
   - `'use client'` directive
   - **Header Section**: Title "Assistente Normative Animali" with subtitle, MessageCircle icon, and AI badge
   - **Emergency Banner**: Red/amber gradient background with pulsing AlertTriangle icon, showing Polizia Municipale 0922 411111 | Carabinieri 112 | ENPA 800 940318
   - **Chat Area** (ScrollArea, 400-450px height):
     - Bot messages: left-aligned with amber-50 background, amber-900 text, Bot avatar
     - User messages: right-aligned with amber-600 background, white text, User avatar
     - Each message has a formatted timestamp (HH:MM)
     - Animated typing indicator with 3 bouncing dots (framer-motion)
   - **5 Quick Questions** as clickable pill/chip buttons with Sparkles label
   - **Input Area**: Input field + Send button icon, Enter key support, disabled while bot is responding
   - **Bot Response Logic**: `useMutation` from `@tanstack/react-query` posting to `/api/chat-ai` with `{ messaggio: string }`, receives `{ risposta: string }`, shows typing indicator while waiting
   - **Toast notifications** via `sonner` on error
   - **framer-motion** animations for messages (fade in + slide), typing indicator (bouncing dots), emergency banner icon (pulse), quick question buttons (whileHover/whileTap)
   - **Welcome message**: Full Italian welcome text as specified
   - Uses shadcn/ui: Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Badge, ScrollArea

3. **Integrated into page.tsx**: Added `ChatAIView` import and `'chat-ai'` case in the switch statement for routing.

4. **Lint check**: Passes with 0 errors (only 1 pre-existing warning in SegnalaView.tsx unrelated to this change).

5. **Dev server**: Running without issues.

## Stage Summary
- ChatAIView component complete and fully functional
- All 6 requirement categories implemented (Header, Emergency Banner, Chat Area, Quick Questions, Input Area, Bot Response Logic)
- Properly integrated into the app's navigation routing
- Zero new lint errors
