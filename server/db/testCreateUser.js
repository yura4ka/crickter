const PG_URL = "http://0.0.0.0:8000/auth/register/";
const C_URL = "http://0.0.0.0:8000/cassandra/user/";

async function createUser(url, user) {
  const start = performance.now();
  const result = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  const end = performance.now();
  await result.json();
  return end - start;
}

function generateUser(prefix, i) {
  const name = `${prefix}_${i}_test_user_${new Date().toISOString()}`;
  return {
    email: name + "@example.com",
    name,
    username: name,
    password: "1234",
  };
}

function printStats(data) {
  let max = 0;
  let min = Infinity;
  let sum = 0;

  for (const n of data) {
    sum += n;
    min = Math.min(min, n);
    max = Math.max(max, n);
  }

  const avg = sum / data.length;

  console.log("Created 100 users");
  console.log("Min time:", min, "Max time:", max, "Avg time:", avg);
}

async function main() {
  const db = process.argv[2];

  if (db === "pg") {
    console.log("creating pg users...");
    const users = new Array(100)
      .fill(undefined)
      .map((_, i) => generateUser("pg", i + 1));

    const start = performance.now();
    const result = await Promise.all(users.map((u) => createUser(PG_URL, u)));
    const end = performance.now();
    printStats(result);
    console.log("total:", end - start);
  } else if (db === "cassandra") {
    console.log("creating cassandra users...");
    const users = new Array(100)
      .fill(undefined)
      .map((_, i) => generateUser("c", i + 1));
    const start = performance.now();
    const result = await Promise.all(users.map((u) => createUser(C_URL, u)));
    const end = performance.now();
    printStats(result);
    console.log("total:", end - start);
  }
}

main();
