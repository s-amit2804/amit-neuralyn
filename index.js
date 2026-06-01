import simpleGit from 'simple-git';
import moment from 'moment';
import random from 'random';
import fs from 'fs';

const git = simpleGit();
const FILE_PATH = './data.js'; // Changed to .js to make the fake code look more natural

// A comprehensive list of highly realistic developer commit messages
const commitMessages = [
    "Refactor authentication middleware",
    "Update database schema for user profiles",
    "Fix memory leak in data processing pipeline",
    "Add unit tests for payment gateway module",
    "Update README with complete deployment instructions",
    "Optimize API search query performance",
    "Clean up dead code and unused imports",
    "Add global error handling and logging",
    "Adjust UI layout for better mobile responsiveness",
    "Fix typo in environment variables loader",
    "Merge feature branch: admin dashboard",
    "Resolve merge conflict in package.json",
    "Upgrade dependencies to patch security vulnerabilities",
    "Implement Redis caching for dashboard metrics",
    "Fix race condition in async state update",
    "Add Dockerfile and docker-compose setup",
    "Refactor frontend components for better reusability",
    "Migrate from REST to GraphQL for main endpoints",
    "Add cursor-based pagination to API responses",
    "Configure CI/CD testing pipeline with GitHub Actions"
];

// Generates fake JavaScript-looking lines of code
const generateRandomCodeLine = () => {
    const keywords = ["const", "let", "function", "async", "await", "return", "try", "catch", "import", "export"];
    const variables = ["data", "user", "response", "config", "query", "result", "payload", "id", "token"];
    let line = "    ";
    
    // Build a random string of 5-8 programming words
    const length = random.int(5, 8);
    for (let i = 0; i < length; i++) {
        const pool = i % 2 === 0 ? keywords : variables;
        line += pool[random.int(0, pool.length - 1)] + " ";
    }
    return `${line.trim()};\n`;
};

const markCommit = async (x, y) => {
    // Generate the historical date
    const date = moment().subtract(x, 'weeks').add(y, 'days').format(); 

    // Generate a massive chunk of code (between 180 and 220 lines per commit)
    const linesToInject = random.int(180, 220);
    let newLines = `\n// === Feature Deployment Date: ${date} ===\n`;
    for (let i = 0; i < linesToInject; i++) {
        newLines += generateRandomCodeLine(); 
    }

    // Append to the file so it grows massively
    fs.appendFileSync(FILE_PATH, newLines);
    await git.add(FILE_PATH);
    
    // Freeze both internal Git clocks to the historical date
    process.env.GIT_AUTHOR_DATE = date;
    process.env.GIT_COMMITTER_DATE = date;

    // Pick a random, realistic commit message
    const message = commitMessages[random.int(0, commitMessages.length - 1)];

    await git.commit(message, { '--date': date });
};

const generateGraph = async () => {
    // 55 commits * ~200 lines = ~11,000 lines of code changed.
    const totalCommits = 55; 
    
    console.log(`Starting... generating ${totalCommits} realistic, heavy commits...`);
    
    for (let i = 0; i < totalCommits; i++) {
        // Spread the commits randomly across the last 52 weeks
        const randomWeek = random.int(0, 52);
        const randomDay = random.int(0, 6);
        await markCommit(randomWeek, randomDay);
        
        console.log(`Progress: Commit ${i + 1}/${totalCommits} completed.`);
    }

    console.log("Sending your highly authentic project to GitHub...");
    await git.push();
    console.log("Done! Check your GitHub. You should have 55 commits and 10k+ lines changed.");
};

generateGraph();