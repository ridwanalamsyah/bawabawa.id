"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? "6281234567890";
const DEFAULT_MSG =
  "Halo Bawabawa.id, saya mau tanya soal titip barang dari Bandung ke Samarinda.";

export function WhatsAppFloat() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(DEFAULT_MSG)}`;

  return (
    <motion.a
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp Bawabawa"
      className="fixed bottom-5 right-5 z-40 group"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 blur-xl group-hover:opacity-60 transition-opacity" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_-12px_rgba(37,211,102,0.55)] transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
          aria-hidden
        >
          <path d="M19.077 4.928A9.93 9.93 0 0 0 12.011 2C6.486 2 2 6.486 2 12.011c0 1.764.461 3.485 1.336 5.007L2 22l5.105-1.317a9.94 9.94 0 0 0 4.906 1.262h.005C17.539 21.945 22 17.46 22 11.939a9.93 9.93 0 0 0-2.923-7.011zm-7.066 15.286a8.21 8.21 0 0 1-4.188-1.145l-.3-.178-3.029.781.81-2.953-.195-.302a8.236 8.236 0 0 1-1.263-4.401c0-4.554 3.706-8.258 8.265-8.258 2.207 0 4.281.86 5.841 2.421a8.207 8.207 0 0 1 2.42 5.846c0 4.555-3.706 8.189-8.36 8.189zm4.532-6.142c-.248-.124-1.466-.723-1.694-.806-.227-.083-.392-.124-.557.124-.165.247-.642.806-.787.971-.145.165-.29.186-.538.062-.248-.124-1.047-.385-1.994-1.23-.737-.658-1.235-1.47-1.38-1.717-.145-.248-.016-.382.108-.506.111-.111.248-.29.371-.434.124-.145.165-.248.248-.413.083-.165.041-.31-.021-.434-.062-.124-.557-1.343-.763-1.838-.201-.483-.405-.418-.557-.426l-.475-.008c-.165 0-.434.062-.661.31s-.868.848-.868 2.067c0 1.219.889 2.397 1.012 2.562.124.165 1.748 2.668 4.235 3.741.592.255 1.053.407 1.413.521.594.189 1.135.162 1.563.099.477-.071 1.466-.6 1.674-1.18.207-.579.207-1.075.145-1.18-.062-.103-.227-.165-.475-.289z" />
        </svg>
      </span>
    </motion.a>
  );
}
