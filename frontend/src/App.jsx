import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function App() {
  const [code, setCode] = useState("// Write JavaScript code here...");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [resultOutput, setResultOutput] = useState("");
  const [activeTab, setActiveTab] = useState("console");
  const editorRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    socket.on("code-sync", (newCode) => setCode(newCode));

    socket.on("code-output", (chunk) => {
      const str = chunk.toString();
      if (str.startsWith("Result:")) {
        setResultOutput(str.replace("Result:", "").trim());
      } else {
        setConsoleOutput((prev) => prev + str);
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      }
    });

    return () => {
      socket.off("code-sync");
      socket.off("code-output");
    };
  }, []);

  const handleEditorChange = (value) => {
    setCode(value);
    socket.emit("code-change", value);
  };

  const runCode = () => {
    setConsoleOutput("");
    setResultOutput("");
    socket.emit("run-code");
  };

  const saveFile = () => {
    const blob = new Blob([code], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "collab-code.js";
    a.click();
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-screen-xl mx-auto bg-white shadow-md rounded-lg p-4">
        <h1 className="text-2xl font-bold mb-4 text-center md:text-left">⚡ CodeCollab (JS + Monaco)</h1>

        {/* Responsive layout: stacked on mobile, side-by-side on md+ */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Editor */}
          <div className="w-full md:w-3/5 h-[400px] md:h-[500px] border rounded">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              onMount={(editor) => (editorRef.current = editor)}
            />
          </div>

          {/* Output Tabs */}
          <div className="w-full md:w-2/5 h-[400px] md:h-[500px] bg-black text-white rounded flex flex-col">
            <div className="flex">
              <button
                onClick={() => setActiveTab("console")}
                className={`flex-1 py-2 text-sm ${
                  activeTab === "console" ? "bg-gray-800" : "bg-gray-700"
                }`}
              >
                🖥 Console
              </button>
              <button
                onClick={() => setActiveTab("result")}
                className={`flex-1 py-2 text-sm ${
                  activeTab === "result" ? "bg-gray-800" : "bg-gray-700"
                }`}
              >
                📤 Result
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 text-sm" ref={outputRef}>
              {activeTab === "console" && (
                <pre className="text-green-300 whitespace-pre-wrap">{consoleOutput}</pre>
              )}
              {activeTab === "result" && (
                <pre className="text-blue-300 whitespace-pre-wrap">{resultOutput}</pre>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center md:justify-start">
          <button onClick={runCode} className="bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto">
            ▶ Run
          </button>
          <button onClick={saveFile} className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto">
            💾 Save
          </button>
        </div>
      </div>
    </div>
  );
}
