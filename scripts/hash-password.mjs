import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error("Usage: npm run hash-password -- 'A-strong-password' (minimum 10 characters)");
  process.exit(1);
}

console.log(await bcrypt.hash(password, 12));
