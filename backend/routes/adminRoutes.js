const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const admin = require("../models/admin.js");

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// ✅ GET all docs
router.get("/get-docs", async (req, res) => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const admin_ = await admin.findOne({ username: adminUsername });

        if (!admin_) {
            return res.status(404).json({ error: "Admin not found" });
        }

        const protocol = process.env.NODE_ENV === "production" ? "https" : req.protocol;
        const documents = admin_.documents.map(doc => ({
            name: doc.name,
            url: `${protocol}://${req.get("host")}/admin/document/${encodeURIComponent(doc.name)}`
        }));

        res.status(200).json({ documents });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Upload doc
router.post("/upload-doc", upload.single("file"), async (req, res) => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const admin_ = await admin.findOne({ username: adminUsername });

        if (!admin_) return res.status(404).json({ error: "Admin not found" });

        admin_.documents.push({ name: req.file.originalname });
        await admin_.save();

        res.status(200).json({ message: "File uploaded successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error uploading file" });
    }
});

// ✅ Delete doc
router.delete("/delete-doc/:name", async (req, res) => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const admin_ = await admin.findOne({ username: adminUsername });

        if (!admin_) return res.status(404).json({ error: "Admin not found" });

        admin_.documents = admin_.documents.filter(doc => doc.name !== req.params.name);
        await admin_.save();

        const filePath = path.join(__dirname, "../uploads", req.params.name);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.status(200).json({ message: "Document deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting file" });
    }
});

// ✅ Serve file
router.get("/document/:name", (req, res) => {
    const filePath = path.join(__dirname, "../uploads", req.params.name);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "File not found" });
    }
});

module.exports = router;
