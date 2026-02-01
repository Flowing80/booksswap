import { Octokit } from "@octokit/rest";
import fs from "fs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function pushArchive() {
  const content = fs.readFileSync("booksswap-hostinger.tar.gz");
  const base64 = content.toString("base64");
  
  try {
    const { data } = await octokit.repos.getContent({
      owner: "Flowing80",
      repo: "booksswap",
      path: "booksswap-hostinger.tar.gz"
    });
    await octokit.repos.createOrUpdateFileContents({
      owner: "Flowing80",
      repo: "booksswap",
      path: "booksswap-hostinger.tar.gz",
      message: "Add Hostinger deployment archive",
      content: base64,
      sha: (data as any).sha
    });
  } catch {
    await octokit.repos.createOrUpdateFileContents({
      owner: "Flowing80",
      repo: "booksswap",
      path: "booksswap-hostinger.tar.gz",
      message: "Add Hostinger deployment archive",
      content: base64
    });
  }
  console.log("✅ Archive pushed to GitHub");
}

pushArchive();
