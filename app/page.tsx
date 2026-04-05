"use client";

import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import "@aws-amplify/ui-react/styles.css";

// Configure Amplify using the generated backend configuration (available after deployment)
// For development, the configuration will be picked up from the sandbox
try {
  const config = require("@/amplify/outputs.json");
  Amplify.configure(config);
} catch (error) {
  // outputs.json will only exist after deployment
  console.log("Amplify outputs not yet available - this is normal during development");
}

// Create client lazily to avoid issues at build time
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    try {
      client = generateClient<Schema>();
    } catch (error) {
      console.warn("Failed to initialize Amplify client:", error);
      return null;
    }
  }
  return client;
}

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [backendAvailable, setBackendAvailable] = useState(false);

  function listTodos() {
    const amplifyClient = getClient();
    if (!amplifyClient) {
      setBackendAvailable(false);
      return;
    }

    try {
      amplifyClient.models.Todo.observeQuery().subscribe({
        next: (data) => {
          setTodos([...data.items]);
          setBackendAvailable(true);
        },
        error: (error) => {
          console.warn("Backend not available:", error);
          setBackendAvailable(false);
        }
      });
    } catch (error) {
      console.warn("Backend not available:", error);
      setBackendAvailable(false);
    }
  }

  useEffect(() => {
    listTodos();
  }, []);

  function createTodo() {
    const amplifyClient = getClient();
    if (!amplifyClient) {
      alert("Backend not available. Please start the Amplify sandbox first.");
      return;
    }

    try {
      const content = window.prompt("Todo content");
      if (content) {
        amplifyClient.models.Todo.create({
          content: content,
        });
      }
    } catch (error) {
      console.error("Failed to create todo:", error);
      alert("Failed to create todo. Backend may not be running.");
    }
  }

  return (
    <main>
      <h1>My todos</h1>
      <div style={{ marginBottom: "1rem", padding: "0.5rem", backgroundColor: backendAvailable ? "#d4edda" : "#f8d7da", color: backendAvailable ? "#155724" : "#721c24", borderRadius: "4px" }}>
        Backend Status: {backendAvailable ? "✅ Connected" : "❌ Not Connected"}
        {!backendAvailable && (
          <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Run <code>npx ampx sandbox</code> to start the backend services
          </div>
        )}
      </div>
      <button onClick={createTodo} disabled={!backendAvailable}>
        + new
      </button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/">
          Review next steps of this tutorial.
        </a>
      </div>
    </main>
  );
}
