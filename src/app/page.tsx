"use client";

import React, { useState, useRef, useEffect } from "react";
import { Manrope } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "700"] });

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

type MessageSender = "user" | "bot" | "typing";

interface Message {
  id: number;
  text: string;
  sender: MessageSender;
}

interface GeminiPart {
  text: string;
}
interface GeminiContent {
  parts: GeminiPart[];
  role: "user" | "model";
}
interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
}
interface GeminiResponse {
  candidates: GeminiCandidate[];
}

const cuteColors = {
  user: "bg-black/80 text-white self-end text-right ml-auto rounded-br-[2rem] rounded-tr-[2rem] rounded-bl-lg",
  bot: "bg-white/70 text-black self-start text-left mr-auto rounded-bl-[2rem] rounded-tl-[2rem] rounded-br-lg",
  typing: "bg-[#f7f5ef]/60 text-black/50 self-start text-left mr-auto rounded-[2rem]",
};

export default function ChatbotUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lastBotMessage = messages.slice().reverse().find((m) => m.sender === "bot")?.text || "";

  useEffect(() => {
    if (typeof window === "undefined" || window.pdfjsLib) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib!.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const parsePDF = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!event.target?.result) throw new Error("Could not read file");
          const typedArray = new Uint8Array(event.target.result as ArrayBuffer);

          await new Promise<void>((ready) => {
            const interval = setInterval(() => {
              if (window.pdfjsLib?.getDocument) {
                clearInterval(interval);
                ready();
              }
            }, 100);
          });

          const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item: any) => item.str).join(" ") + "\n\n";
          }
          resolve(fullText);
        } catch (err) {
          console.error(`Reader failed on ${file.name}`);
          reject(new Error("Invalid PDF or failed to parse."));
        }
      };
      reader.onerror = () => {
        console.error(`Reader failed on ${file.name}`);
        reject(new Error("Reader failed"));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const callGeminiAPI = async (userText: string, fileContents: string): Promise<GeminiResponse> => {
    const apiKey = "AIzaSyBQw3cfL0E_qUPrGIl2hnzWpUUbcTnaVfo";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const historyContents = messages
      .filter((msg) => msg.sender !== "typing")
      .slice(-6)
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

    const newMessage = {
      role: "user",
      parts: [{ text: userText + (fileContents ? `\n\n[File contents: ${fileContents}]` : "") }],
    };

    const data = {
      contents: [...historyContents, newMessage],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 256,
      },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      return (await response.json()) as GeminiResponse;
    } catch (error) {
      console.error("API Error:", error);
      return {
        candidates: [
          {
            content: {
              parts: [{ text: "Sorry, I couldn’t get a response." }],
              role: "model",
            },
            finishReason: "ERROR",
          },
        ],
      };
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const userMessage = customPrompt ?? input;
    if (!userMessage.trim() && files.length === 0) return;

    const messageId = Date.now();
    setMessages((prev) => [...prev, { id: messageId, text: userMessage, sender: "user" }]);
    setInput("");
    setIsTyping(true);
    setMessages((prev) => [...prev, { id: messageId + 1, text: "Typing...", sender: "typing" }]);

    let fileContents = "";
    if (files.length > 0) {
      try {
        const contents = await Promise.all(
          files.map((file) =>
            parsePDF(file).catch((e) => {
              console.error(`Error parsing ${file.name}:`, e);
              return `[Failed to parse file: ${file.name}]`;
            })
          )
        );
        fileContents = contents.join("\n\n");
      } catch (err) {
        console.error("Error parsing files:", err);
      }
    }

    const apiResponse = await callGeminiAPI(userMessage, fileContents);

    setMessages((prev) => prev.filter((msg) => msg.sender !== "typing"));
    setIsTyping(false);

    const botText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn’t get a response.";

    const botMessage: Message = {
      id: messageId + 2,
      text: botText,
      sender: "bot",
    };

    setMessages((prev) => [...prev, botMessage]);
    setFiles([]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center bg-cover bg-center ${manrope.className}`}
      style={{ backgroundImage: `url('/Join-the-Conversation1.gif')` }}
    >
      <div className="w-[420px] max-w-full bg-white/60 backdrop-blur-lg rounded-[2rem] border border-black/10 shadow-xl flex flex-col items-center p-0 overflow-hidden">
        <div className="w-full flex flex-col items-center pt-8 pb-4">
          <h1 className="text-2xl font-bold text-black mt-4 mb-2 text-center">Promptify</h1>
        </div>

        <div
          ref={chatAreaRef}
          className="w-full flex-1 overflow-y-auto px-4 py-4"
          style={{ maxHeight: "50vh", minHeight: "200px" }}
        >
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-end`}
              >
                <div
                  className={`px-5 py-3 shadow ${cuteColors[msg.sender]} max-w-[80%] break-words ${msg.sender === "bot" ? "bot-message" : ""}`}
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\n\n/g, "<br/><br/>")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {lastBotMessage && !isTyping && (
          <div className="w-full px-4 py-2 flex gap-2 justify-center bg-white/60 border-t border-black/10">
            {["Summarize", "Explain more", "Explain shorter"].map((action) => (
              <button
                key={action}
                className="px-3 py-1 text-sm bg-black text-white rounded-full hover:opacity-90"
                onClick={() => handleSend(`${action} this:\n\n${lastBotMessage}`)}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="w-full px-4 py-2 bg-white/60 border-t border-black/10">
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center bg-white/70 rounded-lg px-3 py-2 border border-black/10"
                >
                  <span className="text-sm text-black truncate max-w-[120px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="ml-2 text-sm text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full flex items-center px-4 py-3 border-t border-black/10 bg-white/60 rounded-b-[2rem] gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
            multiple
          />
          <button
            onClick={triggerFileInput}
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 transition"
          >
            📎
          </button>

          <input
            type="text"
            className="flex-1 px-4 py-3 rounded-2xl border border-black/20 focus:outline-none focus:border-black text-base bg-white/90"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={() => handleSend()}
            className="px-4 py-3 rounded-2xl bg-black text-white font-semibold shadow hover:scale-105 active:scale-95 transition"
            disabled={isTyping}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
