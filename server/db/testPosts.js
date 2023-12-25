const crypto = require("crypto");

const PG_URL_U = "http://0.0.0.0:8000/auth/register/";
const C_URL_U = "http://0.0.0.0:8000/cassandra/user/";

async function createUser(url, user) {
  const result = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  return await result.json();
}

async function generateUsers(url, prefix) {
  const date = new Date().toISOString();
  const users = new Array(3).fill(undefined).map((_, i) => ({
    userId: "",
    email: `${prefix}_${i + 1}_${date}@example.com`,
    name: `${prefix}_${i + 1}_${date}`,
    username: `${prefix}_${i + 1}_${date}`,
    password: "1234",
  }));

  const ids = await Promise.all(users.map((u) => createUser(url, u)));
  for (let i = 0; i < ids.length; i++) {
    users[i].userId = ids[i].id;
  }
  return users;
}

const PG_URL = "http://0.0.0.0:8000/test/";
const C_URL = "http://0.0.0.0:8000/cassandra/post/";
const C_COMMENT = (id) => `http://0.0.0.0:8000/cassandra/post/${id}/comment`;
const C_RESPONSE = (id) =>
  `http://0.0.0.0:8000/cassandra/comment/${id}/response`;

const PG_GET = "http://0.0.0.0:8000/post?page=1";
const C_GET = "http://0.0.0.0:8000/cassandra/post?limit=100";
const PG_GET_ID = (id) => `http://0.0.0.0:8000/post/${id}`;
const C_GET_ID = (id) => `http://0.0.0.0:8000/cassandra/post/${id}`;

const PG_GET_USER = (id) => `http://0.0.0.0:8000/user/${id}/posts`;
const C_GET_USER = (id) => `http://0.0.0.0:8000/cassandra/user/${id}/posts`;

const PG_GET_COMMENTS = (id) => `http://0.0.0.0:8000/comment?postId=${id}`;
const C_GET_COMMENTS = (id) =>
  `http://0.0.0.0:8000/cassandra/post/${id}/comments`;

async function createPost(url, user) {
  const start = performance.now();
  const result = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  const end = performance.now();
  const json = await result.json();
  return [end - start, json.id];
}

function generatePgPost(i, userId, commentToId, responseToId) {
  const mediaCount = Math.floor(Math.random() * 3);
  const media = new Array(mediaCount).fill(undefined).map(() => ({
    id: crypto.randomUUID(),
    type: "image",
    url: crypto.randomUUID(),
  }));
  const text = responseToId ? "response" : commentToId ? "comment" : "post";
  const post = {
    text: `pg_${i}_test_${text}_${new Date().toISOString()}`,
    canComment: true,
    userId,
    commentToId,
    responseToId,
  };
  if (mediaCount !== 0) post.media = media;
  return post;
}

function generateCPost(i, user, postId, commentId) {
  return {
    text: `c_${i}_test_post_${new Date().toISOString()}`,
    postId,
    commentId,
    ...user,
  };
}

function printStats(data, message) {
  let max = 0;
  let min = Infinity;
  let sum = 0;

  for (const n of data) {
    sum += n[0];
    min = Math.min(min, n[0]);
    max = Math.max(max, n[0]);
  }

  const avg = sum / data.length;

  console.log(message);
  console.log("Min time:", min, "Max time:", max, "Avg time:", avg);
}

let users;
let data;

async function testCreate() {
  const db = process.argv[2];

  if (db === "pg") {
    users = await generateUsers(PG_URL_U, "pg");
    console.log("creating pg posts...");
    const posts = new Array(100)
      .fill(undefined)
      .map((_, i) =>
        generatePgPost(i + 1, users[Math.floor(Math.random() * 3)].userId)
      );

    let start = performance.now();
    const result = await Promise.all(posts.map((u) => createPost(PG_URL, u)));
    let end = performance.now();
    printStats(result, "created 100 posts");
    console.log("total:", end - start);

    console.log("creating pg comments and responses...");
    const comments = new Array(100)
      .fill(undefined)
      .map((_, i) =>
        generatePgPost(
          i + 1,
          users[Math.floor(Math.random() * 3)].userId,
          result[0][1]
        )
      );
    start = performance.now();
    const result2 = await Promise.all(
      comments.map((u) => createPost(PG_URL, u))
    );
    end = performance.now();
    printStats(result2, "created 100 comments");
    console.log("total:", end - start);

    const responses = new Array(100);
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        responses[i * 10 + j] = generatePgPost(
          i * 10 + j,
          users[Math.floor(Math.random() * 3)].userId,
          result[0][1],
          result2[i][1]
        );
      }
    }
    start = performance.now();
    const result3 = await Promise.all(
      responses.map((u) => createPost(PG_URL, u))
    );
    end = performance.now();
    printStats(result3, "created 100 responses");
    console.log("total:", end - start);
    data = result.map((r) => r[1]);
  } else if (db === "cassandra") {
    users = await generateUsers(C_URL_U, "c");
    console.log("creating cassandra posts...");
    const posts = new Array(100)
      .fill(undefined)
      .map((_, i) =>
        generateCPost(i + 1, users[Math.floor(Math.random() * 3)])
      );

    let start = performance.now();
    const result = await Promise.all(posts.map((u) => createPost(C_URL, u)));
    let end = performance.now();
    printStats(result, "created 100 posts");
    console.log("total:", end - start);

    console.log("creating cassandra comments and responses...");
    const comments = new Array(100)
      .fill(undefined)
      .map((_, i) =>
        generateCPost(i + 1, users[Math.floor(Math.random() * 3)], result[0][1])
      );
    start = performance.now();
    const result2 = await Promise.all(
      comments.map((u) => createPost(C_COMMENT(u.postId), u))
    );
    end = performance.now();
    printStats(result2, "created 100 comments");
    console.log("total:", end - start);

    const responses = new Array(100);
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        responses[i * 10 + j] = generateCPost(
          i * 10 + j,
          users[Math.floor(Math.random() * 3)],
          result[0][1],
          result2[i][1]
        );
      }
    }
    start = performance.now();
    const result3 = await Promise.all(
      responses.map((u) => createPost(C_RESPONSE(u.commentId), u))
    );
    end = performance.now();
    printStats(result3, "created 100 responses");
    console.log("total:", end - start);

    data = result.map((r) => r[1]);
  }
}

async function getPosts(url) {
  const start = performance.now();
  const result = await fetch(url);
  const end = performance.now();
  const json = await result.json();
  return [end - start, json];
}

async function testGet() {
  const db = process.argv[2];
  let start, end;

  if (db === "pg") {
    console.log("fetching pg posts...");
    const p = new Array(10).fill(0);
    start = performance.now();
    const result = await Promise.all(p.map(() => getPosts(PG_GET)));
    end = performance.now();
    printStats(result, "got 100 posts 10 times");
    console.log("total:", end - start);

    console.log("fetching pg posts by id...");
    start = performance.now();
    const result2 = await Promise.all(
      data.map((id) => getPosts(PG_GET_ID(id)))
    );
    end = performance.now();
    printStats(result2, "got 100 posts");
    console.log("total:", end - start);
  } else if (db === "cassandra") {
    console.log("fetching cassandra posts...");
    const p = new Array(10).fill(0);
    start = performance.now();
    const result = await Promise.all(p.map(() => getPosts(C_GET)));
    end = performance.now();
    printStats(result, "got 100 posts 10 times");
    console.log("total:", end - start);

    console.log("fetching cassandra posts by id...");
    start = performance.now();
    const result2 = await Promise.all(data.map((id) => getPosts(C_GET_ID(id))));
    end = performance.now();
    printStats(result2, "got 100 posts");
    console.log("total:", end - start);
  }
}

async function testGetUsersPosts() {
  const db = process.argv[2];
  if (db !== "pg" && db !== "cassandra") return;
  let start, end;

  const url = db === "pg" ? PG_GET_USER : C_GET_USER;
  console.log(`fetching ${db} user's posts...`);
  start = performance.now();
  const result = await Promise.all(users.map((u) => getPosts(url(u.userId))));
  end = performance.now();
  printStats(result, "got total 100 posts for 3 users");
  console.log("total:", end - start);
}

async function testGetComments() {
  const db = process.argv[2];
  if (db !== "pg" && db !== "cassandra") return;
  let start, end;

  const url = db === "pg" ? PG_GET_COMMENTS : C_GET_COMMENTS;
  console.log(`fetching ${db} post's comments...`);
  const result = await getPosts(url(data[0]));
  printStats([result], "got 100 comments");
}

async function main() {
  await testCreate();
  console.log("\n--------------------------------\n");
  await testGet();
  console.log("\n--------------------------------\n");
  await testGetUsersPosts();
  console.log("\n--------------------------------\n");
  await testGetComments();
}

main();
