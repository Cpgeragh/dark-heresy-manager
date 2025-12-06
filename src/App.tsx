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
  onSnapshot,
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

  const [characterName, setCharacterName] = useState("");
  const [characters, setCharacters] = useState<
    { id: string; name: string; userId: string | null; recoveryCode: string }[]
  >([]);

  const [claimCode, setClaimCode] = useState("");
  const [claimedCharacter, setClaimedCharacter] = useState<any | null>(null);


  // -------------------------------
  // Auth + user document setup
  // -------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          const cred = await signInAnonymously(auth)
          user = cred.user
        }

        setCurrentUser(user)

        const userRef = doc(db, "users", user.uid)
        const snap = await getDoc(userRef)

        if (!snap.exists()) {
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

          await setDoc(
            userRef,
            { lastSeen: serverTimestamp() },
            { merge: true }
          )
        }
      } catch (err) {
        console.error("Auth setup error:", err)
      } finally {
        setAuthReady(true)
      }
    })

    return () => unsubscribe()
  }, [])


  // -------------------------------
  // Test Firestore write
  // -------------------------------
  async function createTestEntry() {
    if (!currentUser) return alert("User not ready.")

    try {
      await addDoc(collection(db, "testCollection"), {
        message: "Hello Firestore",
        createdAt: new Date(),
        userId: currentUser.uid,
      })
      alert("Test document created!")
    } catch (error) {
      console.error("Error writing document:", error)
    }
  }


  // -------------------------------
  // TEMP: promote to DM
  // -------------------------------
  async function becomeDM() {
    if (!currentUser) return
    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        { role: "dm" },
        { merge: true }
      )
      setUserRole("dm")
      alert("This device is now DM.")
    } catch (err) {
      console.error("DM set error:", err)
    }
  }


  // -------------------------------
  // Create campaign
  // -------------------------------
  async function createCampaign() {
    if (!currentUser) return alert("User not ready.")
    if (userRole !== "dm") return alert("Only the DM can create campaigns.")

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
      console.error("Campaign creation error:", err)
    } finally {
      setCreatingCampaign(false)
    }
  }


  // -------------------------------
  // Character recovery code generator
  // -------------------------------
  function generateRecoveryCode() {
    const segment = () =>
      Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DH-${segment()}-${segment()}`;
  }


  // -------------------------------
  // Create Character (DM only)
  // -------------------------------
  async function createCharacter() {
    if (!currentUser || !activeCampaignId)
      return alert("No campaign or user loaded.")

    if (userRole !== "dm")
      return alert("Only the DM can create characters.")

    const trimmedName = characterName.trim()
    if (!trimmedName) return alert("Character name cannot be empty.")

    const recoveryCode = generateRecoveryCode()

    try {
      const characterRef = await addDoc(
        collection(db, "campaigns", activeCampaignId, "characters"),
        {
          name: trimmedName,
          userId: null,
          recoveryCode,
          isEditableByPlayer: false,
          createdAt: serverTimestamp(),

          stats: {
            ws: 0, bs: 0, str: 0, tou: 0, agi: 0,
            int: 0, per: 0, wp: 0, fel: 0,
          },
        }
      )

      // Register global recovery lookup
      await setDoc(doc(db, "recoveryCodes", recoveryCode), {
        campaignId: activeCampaignId,
        characterId: characterRef.id,
      })

      alert(`Character "${trimmedName}" created!\nRecovery Code: ${recoveryCode}`)
      setCharacterName("")
    } catch (err) {
      console.error("Character creation error:", err)
      alert("Failed to create character.")
    }
  }


  // -------------------------------
  // Watch characters in campaign
  // -------------------------------
  useEffect(() => {
    if (!activeCampaignId) {
      setCharacters([]);
      return;
    }

    const charsRef = collection(db, "campaigns", activeCampaignId, "characters");

    const unsubscribe = onSnapshot(charsRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      setCharacters(list);
    });

    return () => unsubscribe();
  }, [activeCampaignId]);


  // -------------------------------
  // Claim character using recovery code
  // -------------------------------
  async function claimCharacter() {
    if (!currentUser) return alert("User not ready.")

    const code = claimCode.trim().toUpperCase()
    if (!code) return alert("Please enter a recovery code.")

    try {
      // Lookup code
      const lookupRef = doc(db, "recoveryCodes", code)
      const lookupSnap = await getDoc(lookupRef)

      if (!lookupSnap.exists()) {
        alert("Invalid recovery code.")
        return
      }

      const { campaignId, characterId } = lookupSnap.data() as {
        campaignId: string
        characterId: string
      }

      const charRef = doc(
        db,
        "campaigns",
        campaignId,
        "characters",
        characterId
      )
      const charSnap = await getDoc(charRef)

      if (!charSnap.exists()) {
        alert("Character not found.")
        return
      }

      const charData = charSnap.data()

      // Assign to this user
      await setDoc(charRef, { userId: currentUser.uid }, { merge: true })

      setClaimedCharacter({
        id: characterId,
        campaignId,
        ...charData,
        userId: currentUser.uid,
      })

      alert(`Character "${charData.name}" claimed!`)
    } catch (err) {
      console.error("Claim error:", err)
      alert("Failed to claim character.")
    }
  }


  // -------------------------------
  // UI Rendering
  // -------------------------------
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

        {/* Counter + test write */}
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

        <button onClick={createTestEntry} style={{ marginTop: "1rem" }}>
          Create Firestore Test Document
        </button>

        {/* USER INFO */}
        <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
          <h3>Current User</h3>
          {authReady ? (
            currentUser ? (
              <>
                <div><strong>UID:</strong> <code>{currentUser.uid}</code></div>
                <div><strong>Role:</strong> {userRole}</div>
              </>
            ) : (
              <div>No user.</div>
            )
          ) : (
            <div>Initialising auth…</div>
          )}
        </div>


        {/* DM CONTROLS */}
        <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
          <h3>DM Controls</h3>
          <button onClick={becomeDM} disabled={!currentUser}>
            Make this device DM
          </button>
        </div>


        {/* CAMPAIGN CREATION */}
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
              <strong>Campaign ID:</strong>
              <div><code>{activeCampaignId}</code></div>
            </div>
          )}
        </div>


        {/* CHARACTER CREATION */}
        <div style={{ marginTop: "2rem", textAlign: "left" }}>
          <h3>Create Character (DM only)</h3>

          {!activeCampaignId && (
            <p style={{ color: "gray" }}>Create or select a campaign first.</p>
          )}

          {activeCampaignId && (
            <>
              <input
                type="text"
                placeholder="Character name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                style={{ width: "100%", marginBottom: "0.5rem" }}
              />

              <button
                onClick={createCharacter}
                disabled={userRole !== "dm" || !characterName.trim()}
              >
                Create Character
              </button>

              <div style={{ marginTop: "1rem" }}>
                <h4>Characters in Campaign:</h4>
                {characters.length === 0 ? (
                  <p>No characters yet.</p>
                ) : (
                  <ul>
                    {characters.map((c) => (
                      <li key={c.id}>
                        <strong>{c.name}</strong> — Code: {c.recoveryCode}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>


        {/* CHARACTER CLAIMING */}
        <div style={{ marginTop: "2rem", textAlign: "left" }}>
          <h3>Claim Character</h3>
          <input
            type="text"
            placeholder="Enter recovery code"
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />

          <button onClick={claimCharacter} disabled={!claimCode.trim()}>
            Claim Character
          </button>

          {claimedCharacter && (
            <div style={{ marginTop: "1rem" }}>
              <h4>Claimed Character:</h4>
              <strong>{claimedCharacter.name}</strong>
              <p>Campaign: <code>{claimedCharacter.campaignId}</code></p>
              <p>Character ID: <code>{claimedCharacter.id}</code></p>
            </div>
          )}
        </div>
      </div>

      <p className="read-the-docs">
        This is a prototype. We will split DM/Player dashboards next.
      </p>
    </>
  )
}

export default App
