import { createInvite } from "./db.js";

const label = process.argv[2];
if (!label) {
  console.error("Usage: node create-invite.js <label>");
  process.exit(1);
}

const invite = createInvite(label);
console.log(`Invite created for "${label}"`);
console.log(`Code: ${invite.code}`);
