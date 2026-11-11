import fs from 'fs';
import path from 'path';

const API_KEY = "AIzaSyAE5u0DdTu95grAg3mo4dAfVj2GCelGAPI";
const PROJECT_ID = "studio-7692383559-c5a1c";
const SCHOOL_ID = "tss-main-school";

function decodeFirestoreValue(val) {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in val) {
    const out = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  return val;
}

function decodeDoc(doc) {
  if (!doc) return null;
  const id = doc.name.split('/').pop();
  const data = { _id: id, _name: doc.name };
  if (doc.fields) {
    for (const [k, v] of Object.entries(doc.fields)) {
      data[k] = decodeFirestoreValue(v);
    }
  }
  return data;
}

async function login(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Login failed');
  return data.idToken;
}

async function fetchCollection(token, collectionName) {
  let docs = [];
  let pageToken = '';
  do {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/schools/${SCHOOL_ID}/${collectionName}?pageSize=300${pageParam}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      console.warn(`Failed fetching ${collectionName}: ${res.status} ${res.statusText}`);
      break;
    }
    const data = await res.json();
    if (data.documents) {
      for (const d of data.documents) {
        docs.push(decodeDoc(d));
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return docs;
}

async function fetchRootDoc(token) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/schools/${SCHOOL_ID}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  return decodeDoc(await res.json());
}

async function main() {
  console.log("1. Authenticating with Firebase...");
  const token = await login("admin@tss.com", "spirit533");
  console.log("   Authentication successful!");

  const exportData = {
    exportedAt: new Date().toISOString(),
    schoolDoc: await fetchRootDoc(token),
    collections: {}
  };

  const collections = [
    'settings',
    'students',
    'exams',
    'marks',
    'results',
    'users',
    'assignments',
    'attendance',
    'dateSheets',
    'seatingPlans'
  ];

  for (const col of collections) {
    console.log(`2. Exporting collection: ${col}...`);
    const items = await fetchCollection(token, col);
    exportData.collections[col] = items;
    console.log(`   -> Extracted ${items.length} records from ${col}`);
  }

  const outputPath = path.resolve('backup/firebase_export.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`\n🎉 Full backup saved successfully to: ${outputPath}`);

  console.log("\nSummary of Extracted Data:");
  for (const [col, items] of Object.entries(exportData.collections)) {
    console.log(`- ${col}: ${items.length} items`);
  }
}

main().catch(err => {
  console.error("Export Error:", err);
  process.exit(1);
});
