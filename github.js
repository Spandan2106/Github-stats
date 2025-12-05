import fetch from 'node-fetch';

const GQL = 'https://api.github.com/graphql';
const REST = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || null; // optional but recommended to avoid rate limits

async function callGraphQL(query, variables={}){
  const res = await fetch(GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

export async function getUser(username){
  const r = await fetch(`${REST}/users/${username}`, { headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {} });
  return await r.json();
}

export async function getRepos(username){
  // Simple approach: fetch first 100 public repos (enough for most users). For more, paginate.
  const r = await fetch(`${REST}/users/${username}/repos?per_page=100&sort=updated`, { headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {} });
  return await r.json();
}

export async function getTopLanguages(username){
  const repos = await getRepos(username);
  const totals = {};
  for (const r of repos) {
    try {
      const lr = await fetch(r.languages_url, { headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {} });
      const data = await lr.json();
      for (const k of Object.keys(data || {})) totals[k] = (totals[k]||0) + data[k];
    } catch (e) { /* ignore repo language error */ }
  }
  const arr = Object.entries(totals).map(([name, bytes]) => ({ name, bytes }));
  arr.sort((a,b)=>b.bytes-a.bytes);
  return arr;
}

export async function getContributions(username, year=null){
  // GraphQL query: contributionsCollection. If `year` provided, pass from/to dates.
  // By default get last year contributions.
  let query = `query($login:String!){ user(login:$login){ contributionsCollection{ contributionYears, contributionCalendar{ totalContributions, weeks{ contributionDays{ date, contributionCount } } } } } }`;
  const data = await callGraphQL(query, { login: username });

  // convert to array of weeks -> days
  const weeks = data.user.contributionsCollection.contributionCalendar.weeks;
  // weeks is [{ contributionDays: [{date, contributionCount}, ...] }, ...]
  const result = weeks.map(w => w.contributionDays.map(d => ({ date: d.date, count: d.contributionCount })));
  return result;
}