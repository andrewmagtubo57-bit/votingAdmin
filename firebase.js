// firebase.js: Firebase setup, validation rules and auth helpers for Hero Revamp Vote
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, runTransaction, serverTimestamp,
  collection, onSnapshot, setDoc, getDocs, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Paste the same config object from your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyA5kUAmjKr269ut8Gg5Sr4FuyKh0DYlD2M",
  authDomain: "voting-e0e70.firebaseapp.com",
  projectId: "voting-e0e70",
  storageBucket: "voting-e0e70.firebasestorage.app",
  messagingSenderId: "564239907198",
  appId: "1:564239907198:web:5865176bd932b54b8b1b2f",
  measurementId: "G-EJJ2RG3GBN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* ---------- Validation rules (edit here) ---------- */
export const SERVERS = ["Philippines", "China", "South America", "North America", "Indonesia"];

// Password checklist: each rule is shown as a line and ticked live as the user types.
export const PASSWORD_RULES = [
  { label: "At least 8 characters",        test: (p) => p.length >= 8 },
  { label: "Contains a letter",            test: (p) => /[A-Za-z]/.test(p) },
  { label: "Contains a number",            test: (p) => /[0-9]/.test(p) },
  { label: "Passwords match",              test: (p, c) => p.length > 0 && p === c }
];

export function validateRegister(d) {
  const errors = {};
  if (!/^[A-Za-z0-9_]{3,20}$/.test(d.username)) errors.username = "Use 3–20 letters, numbers or underscores.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errors.email = "Enter a valid email address.";
  if (!/^[0-9]{5,20}$/.test(d.ingameId)) errors.ingameId = "Enter your in-game ID (numbers only).";
  if (!/^[0-9]{11}$/.test(d.mobile)) errors.mobile = "Mobile number must be exactly 11 digits.";
  if (!d.gender) errors.gender = "Choose an option.";
  if (d.address.length < 5) errors.address = "Enter your address.";
  if (!SERVERS.includes(d.server)) errors.server = "Choose your server.";
  if (!PASSWORD_RULES.every(r => r.test(d.password, d.confirm))) errors.password = "Your password doesn’t meet all the requirements.";
  if (d.password !== d.confirm) errors.confirm = "Passwords don’t match.";
  if (!d.terms) errors.terms = "You must agree to the Terms and Conditions.";
  return errors;
}

/* ---------- Auth ---------- */
// Creates the account, then reserves the username and saves the profile in one transaction.
export async function registerUser(d) {
  const cred = await createUserWithEmailAndPassword(auth, d.email, d.password);
  const uid = cred.user.uid;
  try {
    await runTransaction(db, async tx => {
      const nameRef = doc(db, "usernames", d.username.toLowerCase());
      if ((await tx.get(nameRef)).exists()) throw new Error("username-taken");
      tx.set(nameRef, { uid });
      tx.set(doc(db, "users", uid), {
        username: d.username,
        email: d.email,
        ingameId: d.ingameId,
        mobile: d.mobile,
        gender: d.gender,
        address: d.address,
        server: d.server,
        agreedToTerms: true,
        createdAt: serverTimestamp()
      });
    });
  } catch (e) {
    await deleteUser(cred.user); // undo the half-made account
    throw e;
  }
  return cred.user;
}

export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const resetPassword = email => sendPasswordResetEmail(auth, email);
export const logout = () => signOut(auth);
export const onUser = callback => onAuthStateChanged(auth, callback);

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/* ---------- Voting (live, saved online) ---------- */
// One vote per account: the document id is the user's uid, so voting again just switches the vote.
const list = (name, cb, onErr) => onSnapshot(collection(db, name),
  snap => cb(snap.docs.map(d => ({ uid: d.id, ...d.data() }))), onErr);

export const subscribeVotes = (cb, onErr) => list("votes", cb, onErr);
export const subscribeNext = (cb, onErr) => list("nextVotes", cb, onErr);
export const subscribeUsers = (cb, onErr) => list("users", cb, onErr);
export const subscribeVoting = (cb, onErr) =>
  onSnapshot(doc(db, "settings", "voting"), s => cb(s.exists() ? s.data().open !== false : true), onErr);

export const castVote = (uid, heroId) => setDoc(doc(db, "votes", uid), { heroId, updatedAt: serverTimestamp() });
export const castNext = (uid, choice) => setDoc(doc(db, "nextVotes", uid), { choice, updatedAt: serverTimestamp() });

/* ---------- Admin ---------- */
// An admin is any account whose uid has a document in the "admins" collection (create it in the Firebase console).
export async function checkAdmin(uid) {
  return (await getDoc(doc(db, "admins", uid))).exists();
}
export const setVotingOpen = open => setDoc(doc(db, "settings", "voting"), { open, updatedAt: serverTimestamp() });

export async function resetVotes() {
  for (const name of ["votes", "nextVotes"]) {
    const docs = (await getDocs(collection(db, name))).docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

export function friendlyError(e) {
  if (e && e.message === "username-taken") return "That username is taken. Try another one.";
  const map = {
    "auth/email-already-in-use": "That email is already registered.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "That password is too weak.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "permission-denied": "Saving your profile was blocked. Check your Firestore rules."
  };
  return map[e && e.code] || "Something went wrong. Please try again.";
}
