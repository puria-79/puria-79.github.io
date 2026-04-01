const grid = document.getElementById("grid");
const search = document.getElementById("search");
const meta = document.getElementById("meta");
const empty = document.getElementById("empty");

let repositories = [];

function render(items) {
  grid.innerHTML = "";

  if (items.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  for (const repo of items) {
    const card = document.createElement("article");
    card.className = "card";

    const desc = repo.description?.trim() || "No description provided.";
    const title = document.createElement("h2");
    title.textContent = repo.name;

    const descEl = document.createElement("p");
    descEl.className = "description";
    descEl.textContent = desc;

    const links = document.createElement("div");
    links.className = "links";

    const siteLink = document.createElement("a");
    siteLink.href = repo.pageUrl;
    siteLink.target = "_blank";
    siteLink.rel = "noopener noreferrer";
    siteLink.textContent = "Open Site";

    const repoLink = document.createElement("a");
    repoLink.href = repo.repoUrl;
    repoLink.target = "_blank";
    repoLink.rel = "noopener noreferrer";
    repoLink.textContent = "View Repo";

    links.append(siteLink, repoLink);
    card.append(title, descEl, links);

    grid.appendChild(card);
  }
}

function applyFilter() {
  const query = search.value.trim().toLowerCase();
  const filtered = repositories.filter((repo) => {
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.description.toLowerCase().includes(query)
    );
  });

  meta.textContent = `${filtered.length} of ${repositories.length} repositories`;
  render(filtered);
}

async function init() {
  try {
    const response = await fetch("./data/repos.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const payload = await response.json();
    repositories = payload.repositories || [];

    const generatedText = payload.generatedAt
      ? `Updated ${new Date(payload.generatedAt).toLocaleString()}`
      : "Updated recently";

    meta.textContent = `${repositories.length} repositories. ${generatedText}`;
    render(repositories);
  } catch (error) {
    meta.textContent = "Could not load repository data.";
    empty.hidden = false;
  }
}

search.addEventListener("input", applyFilter);
init();
