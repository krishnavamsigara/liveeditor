const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { writeFileSync, unlinkSync } = require("fs");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Use your Vercel frontend domain here:
const FRONTEND_ORIGIN = "https://liveeditor-kappa.vercel.app";

// Enable CORS
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let code = "";

io.on("connection", (socket) => {
  console.log("✅ New client connected");

  socket.emit("code-sync", code);

  socket.on("code-change", (newCode) => {
    code = newCode;
    socket.broadcast.emit("code-sync", newCode);
  });

  socket.on("run-code", () => {
    const filePath = path.join(__dirname, "tempCode.js");

    const wrappedCode = `
(async () => {
  try {
    const result = await (async () => {
      ${code}
    })();
    if (typeof result !== "undefined") {
      console.log("Result:", typeof result === "object"
        ? JSON.stringify(result, null, 2)
        : result);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
`;

    writeFileSync(filePath, wrappedCode);

    const child = spawn("node", [filePath]);

    child.stdout.on("data", (data) => {
      socket.emit("code-output", data.toString());
    });

    child.stderr.on("data", (data) => {
      socket.emit("code-output", "❌ " + data.toString());
    });

    child.on("close", () => {
      try {
        unlinkSync(filePath);
      } catch (_) {}
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// Use dynamic PORT for deployment
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
