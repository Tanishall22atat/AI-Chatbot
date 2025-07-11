# 🧠 Promptify – AI Chatbot with PDF Upload (Gemini API)

Promptify is a beautifully designed AI chatbot interface built with **Next.js 13+**, **React**, and **Tailwind CSS**. It uses **Google's Gemini API** to generate intelligent responses and supports uploading and parsing **PDF documents** using **PDF.js**.

---

## 📁 Project Structure

project-root/
├── public/
│ └── Join-the-Conversation1.gif # Background image for UI
├── src/
│ └── app/
│ └── page.tsx # Main Chatbot component
├── package.json
└── README.md

---

## 🚀 Features

- 🤖 Chat with Gemini API (1.5 Flash)
- 📎 Upload and extract content from PDF files
- 💬 Smart Reply Buttons: Summarize, Explain more, Explain shorter
- 🧠 Memory of last 6 messages for contextual replies
- 🖼️ Beautiful UI with background image and smooth layout
- 📄 Markdown-style formatting in bot replies

---

## 🧠 Tech Stack

- **React**
- **Next.js 13+ (App Router)**
- **Tailwind CSS**
- **Google Fonts – Manrope**
- **PDF.js (via CDN)**
- **Gemini API**

---
**Setup Instructions**
1️⃣ Clone the Repository
git clone https://github.com/yourusername/promptify-chatbot.git
cd promptify-chatbot
2️⃣ Install Dependencies
Make sure you have Node.js installed. Then run:
npm install
💡 This installs all required packages like react, next, and tailwindcss.

3️⃣ Add Your Gemini API Key
You’ll need a Google Gemini API key. Get one from Google AI Studio.

🔓 Set the key in src/app/page.tsx
Open src/app/page.tsx and find this line:
const apiKey = "YOUR_GEMINI_API_KEY";   //Replace the placeholder with your actual API key##
const apiKey = "AIzaSyXXXXXXXXXXXXXX"; // Example
🛡️ Important: This key is hardcoded for simplicity. For production, consider using environment variables.

4️⃣ Run the Development Server
npm run dev
This will start your Next.js app at http://localhost:YOUR_HOST_ADDRESS.


🗂️ Using the App
📎 Click the paperclip to upload one or more PDF files.

✍️ Type your prompt and click Send.

⏳ The bot responds after parsing PDF + generating context-aware reply.

💡 Smart reply buttons appear after each bot message.

📌 Notes
PDF parsing uses PDF.js via CDN — no install needed.

Supports multi-page PDF extraction.

Typing indicator ("Typing...") is shown while waiting for Gemini response.

🖼️ Customization
Background Image: Replace public/Join-the-Conversation1.gif with your own.

Fonts: Uses Google Font Manrope — modify in page.tsx.

Styling: All styles use Tailwind CSS and can be edited inline in page.tsx.



🙏 Credits
🤖 Powered by Google Gemini API

📄 PDF Parsing via Mozilla PDF.js

💅 UI built with Tailwind CSS

✨ Author
Made with 💛 by Tanishall22atat
