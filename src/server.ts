import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { ScoreInfoHtml, ScoreInfoObj } from "./scoreinfo";
import { fetchBuffer } from "./utils";
import { getFileUrl } from "./file";
import { exportPDF } from "./pdf";
import sanitize from "sanitize-filename";
import he from "he";


const SCORE_URL_REG = /^(?:https?:\/\/)(?:(?:s|www)\.)?musescore\.com\/[^\s]+$/;

const createDirectoryIfNotExist = (input: string) => {
    const dirExists = fs.existsSync(input);

    if (!dirExists) {
        fs.mkdirSync(input, { recursive: true });
    }
};


const PORT = 3000;

const app = express();
app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));

app.post("/download", async (req, res) => {
    const { input, type, verbose = false } = req.body;

    if (!input || !SCORE_URL_REG.test(input)) {
        return res.status(400).json({ error: "URL MuseScore invalide." });
    }

    if (!Array.isArray(type) || type.length === 0) {
        return res.status(400).json({ error: "Pas de type de fichier spécifié." });
    }

    if (["mscz", "mscx", "musicxml", "flac", "ogg"].some(e => type.includes(e))) {
        return res.status(400).json({ error: "Le téléchargement de ces types de fichiers n'est pas pris en charge." });
    }

    const urlMatch = input.match(SCORE_URL_REG);
    const normalizedUrl = urlMatch ? urlMatch[0] : input;

    let scoreinfo;
    try {
        scoreinfo = await ScoreInfoHtml.request(normalizedUrl);
    } catch (e) {
        return res.status(500).json({ error: "Impossible de récupérer les informations sur la partition." });
    }

    console.log(scoreinfo)

    if (scoreinfo.id === 0) {
        return res.status(404).json({ error: "Partition introuvable." });
    }

    if (verbose) {
        console.log(`Score ID: ${scoreinfo.id}, Title: ${scoreinfo.title}`);
    }

    const outputDir = path.join("downloads", uuidv4());
    await createDirectoryIfNotExist(outputDir);

    try {
        await fs.promises.access(outputDir);
    } catch (err) {
        return res.status(500).json({ error: "Impossible de créer le répertoire de téléchargement." });
    }

    const downloadedFiles: string[] = [];

    await Promise.all(
        type.map(async (format) => {
            let fileExt;
            let fileData;

            try {
                switch (format) {
                    case "midi":
                        fileExt = "mid";
                        fileData = await fetchBuffer(await getFileUrl(scoreinfo.id, "midi", normalizedUrl));
                        break;
                    case "mp3":
                        fileExt = "mp3";
                        fileData = await fetchBuffer(await getFileUrl(scoreinfo.id, "mp3", normalizedUrl));
                        break;
                    case "pdf":
                        fileExt = "pdf";
                        fileData = Buffer.from(await exportPDF(scoreinfo, scoreinfo.sheet, normalizedUrl));
                        break;
                    default:
                        throw new Error(`Unsupported format: ${format}`);
                }

                const rawName = scoreinfo.fileName || "score";
                const decodedName = he.decode(rawName); // Turns &#039; into '
                const safeName = sanitize(decodedName) || "score"; // Removes dangerous characters
                const filename = `${safeName}.${fileExt}`;
                const filePath = path.join(outputDir, filename);
                await fs.promises.writeFile(filePath, fileData);

                downloadedFiles.push(`/files/${path.relative("downloads", filePath)}`);
            } catch (err) {
                console.error(`Failed to process ${format}:`, err.message);
            }
        })
    );

    res.json({ message: "Fichiers téléchargés", files: downloadedFiles });
});


app.get("/download/:dir/:filename", async (req, res) => {
    const { dir, filename } = req.params;

    if (!dir || !filename) {
        return res.status(400).json({ error: "Paramètres manquants." });
    }

    const filePath = path.join("downloads", dir, filename);

    try {
        await fs.promises.access(filePath);
        res.download(filePath);
    } catch (err) {
        return res.status(404).json({ error: "Fichier introuvable." });
    }
});


app.use("/files", express.static("downloads"));



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

