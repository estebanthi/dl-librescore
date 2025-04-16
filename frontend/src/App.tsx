import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";

export default function App() {
    const [url, setUrl] = useState<string>("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<string[]>([]); // URLs of downloaded files

    const availableTypes = ["pdf", "midi", "mp3"];

    const toggleType = (type: string) => {
        setSelectedTypes((prev: string[]) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
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
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || "Unknown error occurred.");
            } else {
                setError("Unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center p-10">
            <motion.h1
                className="text-3xl font-bold mb-6 text-white"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                MuseScore DL
            </motion.h1>

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Entrez l'URL de la partition MuseScore"
                    className="w-full p-3 mb-4 rounded-lg border border-white bg-slate-700 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
                />

                <div className="flex flex-wrap gap-2 mb-4">
                    {availableTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`px-4 py-2 rounded-lg text-white border-2 font-semibold transition ${
                                selectedTypes.includes(type)
                                    ? "bg-slate-600 border-slate-400"
                                    : "bg-slate-700 border-slate-600 hover:bg-slate-600"
                            }`}
                        >
                            {type.toUpperCase()}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isLoading || !url || selectedTypes.length === 0}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold transition disabled:opacity-50 cursor-pointer hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "Télécharger"}
                </button>

                {error && (
                    <motion.div
                        className="bg-red-500/10 text-red-400 border border-red-400 p-4 rounded-xl flex items-center gap-3 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <AlertCircle />
                        <span>{error}</span>
                    </motion.div>
                )}

                {files.length > 0 && (
                    <motion.div
                        className="bg-green-500/10 text-green-400 border border-green-400 p-4 rounded-xl mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <h2 className="text-lg font-semibold mb-2">
                            Cliquez pour télécharger :
                        </h2>
                        <div className="flex flex-col gap-1">
                            {files.map((fileUrl, i) => {
                                const fileName = decodeURIComponent(
                                    fileUrl.split("/").pop() || ""
                                );
                                return (
                                    <a
                                        key={i}
                                        href={`__API_URL__${fileUrl}`}
                                        download
                                        className="block p-3 rounded-lg transition hover:bg-green-500/20"
                                        target="_blank"
                                    >
                                        {fileName}
                                    </a>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
