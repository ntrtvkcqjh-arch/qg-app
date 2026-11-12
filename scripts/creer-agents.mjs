// Crée (ou met à jour) les skills, environnements et agents du QG.
// Usage : node --env-file=.env.local scripts/creer-agents.mjs [--essai]
//   --essai : affiche ce qui serait envoyé, sans rien créer.
//
// Idempotent : les identifiants créés sont gardés dans
// config/managed-agents.lock.json (pas des secrets). Relancer le script
// met à jour les mêmes objets au lieu d'en créer de nouveaux.
import fs from "node:fs";
import path from "node:path";
import Anthropic, { toFile } from "@anthropic-ai/sdk";
import { AGENTS, ENVIRONNEMENTS, MODELE, SKILLS, outilsPour } from "./agents-config.mjs";

const RACINE = path.resolve(import.meta.dirname, "..");
const LOCK = path.join(RACINE, "config/managed-agents.lock.json");
const ESSAI = process.argv.includes("--essai");

const lire = (p) => fs.readFileSync(path.join(RACINE, p), "utf8");
const lock = fs.existsSync(LOCK)
  ? JSON.parse(fs.readFileSync(LOCK, "utf8"))
  : { skills: {}, environnements: {}, agents: {} };
const sauver = () => {
  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  fs.writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n");
};

// Prompt système = fichiers du pack, dans l'ordre, sans réécriture.
function promptSysteme(agent) {
  return agent.fichiers
    .map((f) => `<!-- Fichier : ${path.basename(f)} -->\n${lire(f).trim()}`)
    .join("\n\n---\n\n");
}

async function fichiersSkill(nom, dossier) {
  const abs = path.join(RACINE, dossier);
  return Promise.all(
    fs.readdirSync(abs).map((f) =>
      toFile(fs.createReadStream(path.join(abs, f)), `${nom}/${f}`, {
        type: f.endsWith(".md") ? "text/markdown" : f.endsWith(".html") ? "text/html" : "text/plain",
      }),
    ),
  );
}

if (ESSAI) {
  for (const [id, a] of Object.entries(AGENTS)) {
    const sys = promptSysteme(a);
    console.log(`\n=== ${a.nom} (${id})`);
    console.log("modèle :", JSON.stringify(MODELE));
    console.log("skills :", a.skills.join(", "));
    console.log("outils :", a.outils.map((o) => o.name).join(", "));
    console.log("environnement :", JSON.stringify(ENVIRONNEMENTS[a.environnement].config.networking));
    console.log(`prompt système : ${sys.length} caractères, fichiers : ${a.fichiers.join(", ")}`);
  }
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY manquante dans .env.local.");
  process.exit(1);
}
const client = new Anthropic();

// 1. Skills
for (const [nom, dossier] of Object.entries(SKILLS)) {
  const files = await fichiersSkill(nom, dossier);
  if (lock.skills[nom]) {
    await client.skills.versions.create(lock.skills[nom], { files });
    console.log(`skill ${nom} : nouvelle version`);
  } else {
    const s = await client.skills.create({ files, display_name: nom });
    lock.skills[nom] = s.id;
    sauver();
    console.log(`skill ${nom} : créé (${s.id})`);
  }
}

// 2. Environnements (créés une fois)
for (const [cle, e] of Object.entries(ENVIRONNEMENTS)) {
  if (!lock.environnements[cle]) {
    const env = await client.beta.environments.create({
      name: e.nom,
      config: e.config,
      metadata: { qg: "phase1" },
    });
    lock.environnements[cle] = env.id;
    sauver();
    console.log(`environnement ${e.nom} : créé (${env.id})`);
  } else {
    console.log(`environnement ${e.nom} : existe déjà (${lock.environnements[cle]})`);
  }
}

// 3. Agents
for (const [cle, a] of Object.entries(AGENTS)) {
  const params = {
    name: a.nom,
    description: a.description,
    model: MODELE,
    system: promptSysteme(a),
    tools: outilsPour(a),
    skills: a.skills.map((s) => ({ type: "custom", skill_id: lock.skills[s], version: "latest" })),
    metadata: { qg: "phase1", cle },
  };
  if (lock.agents[cle]) {
    const ag = await client.beta.agents.update(lock.agents[cle], params);
    console.log(`agent ${a.nom} : mis à jour (version ${ag.version})`);
  } else {
    const ag = await client.beta.agents.create(params);
    lock.agents[cle] = ag.id;
    sauver();
    console.log(`agent ${a.nom} : créé (${ag.id}, version ${ag.version})`);
  }
}

console.log("\nÀ reporter dans .env.local et dans Vercel :");
for (const [cle, a] of Object.entries(AGENTS)) console.log(`${a.envVar}=${lock.agents[cle]}`);
for (const [cle, e] of Object.entries(ENVIRONNEMENTS)) console.log(`${e.envVar}=${lock.environnements[cle]}`);
