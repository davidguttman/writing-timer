// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc
} from 'firebase/firestore/lite'

const firebaseConfig = {
  apiKey: 'AIzaSyAzqiRHjwdv3N3sTpgfsX9WF57SX0Ktxs4',
  authDomain: 'book-time-tracker.firebaseapp.com',
  projectId: 'book-time-tracker',
  storageBucket: 'book-time-tracker.appspot.com',
  messagingSenderId: '974438094220',
  appId: '1:974438094220:web:9ac465c8dd747dfcbdb2a9'
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

module.exports = {
  saveSession,
  getSessions
}

async function saveSession () {
  const datetime = new Date().toISOString()
  await setDoc(doc(db, 'sessions', datetime), {
    datetime
  })
}

async function getSessions (db) {
  const sessionsCol = collection(db, 'sessions')
  const sessionSnapshot = await getDocs(sessionsCol)
  const sessionList = sessionSnapshot.docs.map(doc => doc.data())
  return sessionList
}
