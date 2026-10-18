// Fyller databasen med exempelmedlemmar och exempeluppgifter.
// Kör med: npm run seed
//
// Skriptet lägger till data, det tar inte bort något. Kör du det två gånger
// får du alla medlemmar och uppgifter två gånger.

import { goOffline, push, ref } from "firebase/database";
import type { DatabaseReference } from "firebase/database";
import { db } from "../src/firebase.ts";
import type { MemberData, TaskData } from "../src/models.ts";

// Datum som text, t.ex. "2026-10-30", ett antal dagar från idag.
// Negativa tal ger ett datum bakåt i tiden.
function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// Firebase väntar i all evighet om databasURL:en är fel,
// så vi ger upp efter 10 sekunder i stället.
async function saveWithTimeout(path: string, data: MemberData | TaskData): Promise<DatabaseReference> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Fick inget svar från databasen inom 10 sekunder.")), 10_000);
  });
  try {
    return await Promise.race([push(ref(db, path), data), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const members: MemberData[] = [
  { name: "Anna Andersson", categories: ["frontend", "ux"] },
  { name: "Björn Berg", categories: ["backend"] },
  { name: "Cecilia Carlsson", categories: ["ux"] },
  { name: "David Dahl", categories: ["frontend", "backend"] },
];

async function seed(): Promise<void> {
  if (db.app.options.databaseURL?.includes("ditt-projekt")) {
    throw new Error("Klistra in din egen firebaseConfig i src/firebase.ts först.");
  }

  // Spara medlemmarna och kom ihåg deras id:n, så att uppgifterna kan tilldelas dem.
  const ids: string[] = [];
  for (const member of members) {
    const saved = await saveWithTimeout("members", member);
    ids.push(saved.key!);
    console.log("Medlem:  " + member.name);
  }
  const [anna, bjorn, cecilia, david] = ids;

  const tasks: TaskData[] = [
    // Nya
    {
      title: "Bygg inloggningssida",
      description: "Formulär med e-post och lösenord.",
      category: "frontend",
      status: "ny",
      deadline: daysFromToday(10),
    },
    {
      title: "Skapa API för uppgifter",
      description: "Endpoints för att hämta, skapa och ta bort uppgifter.",
      category: "backend",
      status: "ny",
      deadline: daysFromToday(14),
    },
    {
      title: "Användartester av tavlan",
      description: "Testa tavlan med fem användare och skriv ner vad de fastnar på.",
      category: "ux",
      status: "ny",
      deadline: daysFromToday(21),
    },
    // Pågående
    {
      title: "Responsiv layout",
      description: "Kolumnerna ska hamna under varandra på mobil.",
      category: "frontend",
      status: "pågående",
      deadline: daysFromToday(5),
      assignedTo: anna,
    },
    {
      title: "Databasregler",
      description: "Validera att alla uppgifter har titel, kategori och deadline.",
      category: "backend",
      status: "pågående",
      deadline: daysFromToday(3),
      assignedTo: david,
    },
    // Slutförda
    {
      title: "Wireframes för tavlan",
      description: "Skisser för de tre kolumnerna och formulären.",
      category: "ux",
      status: "slutförd",
      deadline: daysFromToday(-3),
      assignedTo: cecilia,
      completedAt: daysFromToday(-5),
    },
    {
      title: "Sätt upp Firebase-projektet",
      description: "Skapa projektet och aktivera Realtime Database.",
      category: "backend",
      status: "slutförd",
      deadline: daysFromToday(-7),
      assignedTo: bjorn,
      completedAt: daysFromToday(-8),
    },
  ];

  for (const task of tasks) {
    await saveWithTimeout("tasks", task);
    console.log("Uppgift: " + task.title + " (" + task.status + ")");
  }

  console.log("\nKlart! " + members.length + " medlemmar och " + tasks.length + " uppgifter tillagda.");
}

try {
  await seed();
} catch (error) {
  console.error("Kunde inte fylla databasen:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  // Stäng anslutningen, annars avslutas aldrig skriptet.
  goOffline(db);
}
