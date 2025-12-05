import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// Firestore
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";

// Auth
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import type { User } from "firebase/auth";

function App() {
  const [count, setCount] = useState(0)

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [userRole, setUserRole] = useState<"player" | "dm" | "unknown">("unknown")

  const [campaignName, setCampaignName] = useState("")
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [creatingCampaign, setCreatingCampaign] = useState(false)

  // Auth + user document setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          // Not signed in yet → sign in anonymously
          const cred = await signInAnonymously(auth)
          user = cred.user
        }

        setCurrentUser(user)

        // Create or load user document
        const userRef = doc(db, "users", user.uid)
        const snap = await getDoc(userRef)

        if (!snap.exists()) {
          // New user → default to "player"
          await setDoc(userRef, {
            role: "player",
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
          })
          setUserRole("player")
        } else {
          const data = snap.data() as { role?: string }
          const role = data.role === "dm" ? "dm" : "player"
          setUserRole(role)

          // Update lastSeen
          await setDoc(
            userRef,
            { lastSeen: serverTimestamp() },
            { merge: true }
          )
        }
      } catch (err) {
        console.error("Error during auth/user setup:", err)
      } finally {
        setAuthReady(true)
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

  // TEMP: promote this device to DM
  async function becomeDM() {
    if (!currentUser) return
    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        { role: "dm" },
        { merge: true }
      )
      setUserRole("dm")
      alert("This device is now marked as DM (temporary).")
    } catch (err) {
      console.error("Error setting DM role:", err)
      alert("Failed to set DM role.")
    }
  }

  // Create a campaign (DM only)
  async function createCampaign() {
    if (!currentUser) {
      alert("User not ready.")
      return
    }
    if (userRole !== "dm") {
      alert("Only the DM can create campaigns.")
      return
    }

    const trimmedName = campaignName.trim() || "Untitled campaign"

    try {
      setCreatingCampaign(true)
      const docRef = await addDoc(collection(db, "campaigns"), {
        name: trimmedName,
        dmId: currentUser.uid,
        createdAt: serverTimestamp(),
      })
      setActiveCampaignId(docRef.id)
      setCampaignName("")
      alert(`Campaign "${trimmedName}" created.`)
    } catch (err) {
      console.error("Error creating campaign:", err)
      alert("Failed to create campaign.")
    } finally {
      setCreatingCampaign(false)
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

      <h1>Dark Heresy Manager (Prototype)</h1>

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

        <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
          <h3>Current User</h3>
          {authReady ? (
            currentUser ? (
              <>
                <div><strong>UID:</strong> <code>{currentUser.uid}</code></div>
                <div><strong>Role:</strong> {userRole}</div>
              </>
            ) : (
              <div>No user (this should be rare).</div>
            )
          ) : (
            <div>Initialising auth…</div>
          )}
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
          <h3>DM Controls (temporary)</h3>
          <button onClick={becomeDM} disabled={!currentUser}>
            Make this device DM
          </button>
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
          <h3>Create Campaign (DM only)</h3>
          <input
            type="text"
            placeholder="Campaign name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <button
            onClick={createCampaign}
            disabled={!currentUser || userRole !== "dm" || creatingCampaign}
          >
            {creatingCampaign ? "Creating..." : "Create Campaign"}
          </button>

          {activeCampaignId && (
            <div style={{ marginTop: "0.75rem" }}>
              <strong>Last created campaign ID:</strong>
              <div><code>{activeCampaignId}</code></div>
            </div>
          )}
        </div>
      </div>

      <p className="read-the-docs">
        This is a prototype. We’ll split DM/Player views and proper routing later.
      </p>
    </>
  )
}

export default App