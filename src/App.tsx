import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// Firestore
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "./firebase";

// Auth
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import type { User } from "firebase/auth";

function App() {
  const [count, setCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  // Set up anonymous auth on app load
  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Already signed in (or just signed in)
        setCurrentUser(user)
        setAuthReady(true)
      } else {
        // Not signed in yet: sign in anonymously
        try {
          const cred = await signInAnonymously(auth)
          setCurrentUser(cred.user)
          setAuthReady(true)
        } catch (error) {
          console.error("Error with anonymous sign-in:", error)
          setAuthReady(true)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // Test Firestore write
  async function createTestEntry() {
    if (!currentUser) {
      alert("User not ready yet, please wait a moment.")
      return
    }

    try {
      await addDoc(collection(db, "testCollection"), {
        message: "Hello Firestore",
        createdAt: new Date(),
        userId: currentUser.uid,
      })
      alert("Test document created!")
    } catch (error) {
      console.error("Error writing document: ", error)
      alert("Failed to write document — see console for details.")
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1>Vite + React + Firebase</h1>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

        <button onClick={createTestEntry} style={{ marginTop: "1rem" }}>
          Create Firestore Test Document
        </button>

        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>

        <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          {authReady ? (
            currentUser ? (
              <div>
                <div><strong>Anon user ID:</strong></div>
                <code>{currentUser.uid}</code>
              </div>
            ) : (
              <span>Auth ready, but no user.</span>
            )
          ) : (
            <span>Initialising auth…</span>
          )}
        </div>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
