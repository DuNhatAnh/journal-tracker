export interface CitationAuthor {
  name: string;
}

export interface CitationPaper {
  id: number;
  title: string;
  published_year: number;
  citations_count: number;
  doi?: string;
  authors: CitationAuthor[];
  journal?: { name: string };
}

// Convert author name to standard APA style e.g., "John Doe" -> "Doe, J." or "Nguyen Van A" -> "Nguyen, V. A."
export function formatAPA(paper: CitationPaper): string {
  const formattedAuthors = paper.authors.map(author => {
    const parts = author.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + ".").join(" ");
    return `${lastName}, ${initials}`;
  });

  let authorStr = "";
  if (formattedAuthors.length === 0) {
    authorStr = "Nhiều tác giả";
  } else if (formattedAuthors.length === 1) {
    authorStr = formattedAuthors[0];
  } else if (formattedAuthors.length === 2) {
    authorStr = `${formattedAuthors[0]} & ${formattedAuthors[1]}`;
  } else {
    authorStr = `${formattedAuthors.slice(0, -1).join(", ")}, & ${formattedAuthors[formattedAuthors.length - 1]}`;
  }

  const journalStr = paper.journal ? `, ${paper.journal.name}` : "";
  return `${authorStr} (${paper.published_year}). ${paper.title}${journalStr}.`;
}

// Format paper in BibTeX
export function formatBibTeX(paper: CitationPaper): string {
  const authorLast = paper.authors.length > 0 
    ? paper.authors[0].name.trim().split(/\s+/).pop()?.toLowerCase() || "paper"
    : "paper";
  const citationKey = `${authorLast}${paper.published_year}_${paper.id}`;
  const authorNames = paper.authors.map(a => a.name).join(" and ");

  let bib = `@article{${citationKey},\n`;
  bib += `  author  = {${authorNames}},\n`;
  bib += `  title   = {${paper.title}},\n`;
  bib += `  journal = {${paper.journal?.name || "SciTrend Research Repository"}},\n`;
  bib += `  year    = {${paper.published_year}}`;
  if (paper.doi) {
    bib += `,\n  doi     = {${paper.doi}}`;
  }
  bib += `\n}`;
  return bib;
}

// Format paper in RIS
export function formatRIS(paper: CitationPaper): string {
  let ris = "TY  - JOUR\n";
  ris += `TI  - ${paper.title}\n`;
  paper.authors.forEach(a => {
    ris += `AU  - ${a.name}\n`;
  });
  ris += `PY  - ${paper.published_year}\n`;
  if (paper.journal) {
    ris += `JO  - ${paper.journal.name}\n`;
  }
  if (paper.doi) {
    ris += `DO  - ${paper.doi}\n`;
  }
  ris += "ER  - \n";
  return ris;
}

// Download citation content in browser
export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export a list of papers to BibTeX
export function exportToBibTeX(papers: CitationPaper[]) {
  const content = papers.map(p => formatBibTeX(p)).join("\n\n");
  downloadTextFile("scitrend-citations.bib", content);
}

// Export a list of papers to RIS
export function exportToRIS(papers: CitationPaper[]) {
  const content = papers.map(p => formatRIS(p)).join("\n");
  downloadTextFile("scitrend-citations.ris", content);
}
