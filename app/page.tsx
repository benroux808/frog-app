"use client";

import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import "@aws-amplify/ui-react/styles.css";

// Configure Amplify for local development
// For now, using a basic configuration - the sandbox has CDK compatibility issues
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: "http://localhost:54321/graphql",
      region: "us-east-1",
      defaultAuthMode: "apiKey",
      apiKey: "da2-fakeApiId123456",
    },
  },
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_fakeUserPoolId",
      userPoolClientId: "fakeUserPoolClientId",
      region: "us-east-1",
    },
  },
});

// Create client - will work once backend is properly running
let client: ReturnType<typeof generateClient<Schema>>;
try {
  client = generateClient<Schema>();
} catch (error) {
  console.warn("Backend not available, using mock client for UI testing");
  // For UI testing without backend, we'll handle this gracefully
}

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [backendAvailable, setBackendAvailable] = useState(false);

  function listTodos() {
    if (!client) return;

    try {
      client.models.Todo.observeQuery().subscribe({
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
    if (!client) {
      alert("Backend not available. Please start the Amplify sandbox first.");
      return;
    }

    try {
      const content = window.prompt("Todo content");
      if (content) {
        client.models.Todo.create({
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
