import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { fireFullScreenConfetti } from "./utils/confetti";

const translations = {
    en: {
        title: "MuseScore DL",
        placeholder: "Enter MuseScore URL",
        download: "Download",
        clickToDownload: "Click to download:",
        unknownError: "Unknown error occurred.",
    },
    fr: {
        title: "MuseScore DL",
        placeholder: "Entrez l'URL MuseScore",
        download: "Télécharger",
        clickToDownload: "Cliquez pour télécharger :",
        unknownError: "Une erreur inconnue est survenue.",
    },
};

const supportedLanguages = ["en", "fr"] as const;
type Language = (typeof supportedLanguages)[number];

export default function App() {
    const [url, setUrl] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<string[]>([]);
    const [language, setLanguage] = useState<Language>("en");

    const t = translations[language];

    useEffect(() => {
        const stored = localStorage.getItem("language") as Language | null;
        if (stored && supportedLanguages.includes(stored)) {
            setLanguage(stored);
        } else {
            const browserLang = navigator.language.slice(0, 2) as Language;
            setLanguage(supportedLanguages.includes(browserLang) ? browserLang : "en");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("language", language);
    }, [language]);

    const toggleType = (type: string) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const handleDownload = async () => {
        setIsLoading(true);
        setError(null);
        setFiles([]);

        try {
            const res = await axios.post<{ files: string[] }>("__API_URL__/download", {
                input: url,
                type: selectedTypes,
            });

            setFiles(res.data.files);
            fireFullScreenConfetti();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || t.unknownError);
            } else {
                setError(t.unknownError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
            <motion.div
                className="w-full max-w-md sm:max-w-xl bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <div className="flex items-center justify-between mb-6">
                    <motion.h1
                        className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {t.title}
                    </motion.h1>
                    <div className="flex gap-2">
                        {[
                            { code: "fr", emoji: "🇫🇷" },
                            { code: "en", emoji: "🇬🇧" },
                        ].map(({ code, emoji }) => (
                            <button
                                key={code}
                                onClick={() => setLanguage(code as Language)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 text-xl rounded-full flex items-center justify-center transition-colors ${
                                    language === code
                                        ? "ring-2 ring-blue-400 bg-slate-700"
                                        : "bg-slate-700 opacity-60 hover:opacity-100"
                                }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.placeholder}
                    className="w-full p-3 mb-5 rounded-lg border border-white/10 bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                />

                <motion.div
                    className="flex flex-wrap gap-2 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {["pdf", "midi", "mp3"].map((type) => (
                        <button
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                                selectedTypes.includes(type)
                                    ? "bg-blue-600 border-blue-500 text-white shadow-md"
                                    : "bg-slate-700 border-slate-500 text-slate-300 hover:bg-slate-600"
                            }`}
                        >
                            {type.toUpperCase()}
                        </button>
                    ))}
                </motion.div>

                <motion.button
                    onClick={handleDownload}
                    disabled={isLoading || !url || selectedTypes.length === 0}
                    className="w-full flex justify-center items-center bg-blue-600 text-white p-3 rounded-xl font-semibold transition-all disabled:opacity-50 hover:bg-blue-500 focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : t.download}
                </motion.button>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="bg-red-600/10 text-red-400 border border-red-500 p-4 rounded-xl flex items-center gap-3 mt-5"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <AlertCircle />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {files.length > 0 && (
                        <motion.div
                            className="bg-green-600/10 text-green-300 border border-green-500 p-4 rounded-xl mt-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <h2 className="text-lg font-bold mb-2">{t.clickToDownload}</h2>
                            <div className="flex flex-col gap-2">
                                {files.map((fileUrl, i) => {
                                    const fileName = decodeURIComponent(fileUrl.split("/").pop() || "");
                                    return (
                                        <a
                                            key={i}
                                            href={`__API_URL__${fileUrl}`}
                                            download
                                            className="block p-2 px-4 rounded-lg bg-green-800/20 hover:bg-green-600/30 transition-colors"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {fileName}
                                        </a>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
