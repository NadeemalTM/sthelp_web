export const RESOURCE_CATEGORIES = [
  "Research papers",
  "Sri Lankan research",
  "References & citations",
  "Writing & grammar",
  "AI study tools",
  "Surveys & data collection",
  "Data analysis",
  "Programming",
  "Reports & formatting",
  "Presentations & diagrams",
  "Group work"
] as const;

export const RESOURCE_ACCESS_TYPES = ["free", "freemium", "university", "paid", "varies"] as const;

export type ResourceAccess = (typeof RESOURCE_ACCESS_TYPES)[number];

export type StudentResource = {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  thumbnail_url: string | null;
  access_type: ResourceAccess;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

function resource(
  id: string,
  title: string,
  category: (typeof RESOURCE_CATEGORIES)[number],
  description: string,
  url: string,
  access_type: ResourceAccess,
  sort_order: number,
  is_featured = false
): StudentResource {
  return { id, title, category, description, url, thumbnail_url: null, access_type, sort_order, is_featured, is_published: true };
}

export const defaultStudentResources: StudentResource[] = [
  resource("scholar", "Google Scholar", "Research papers", "Find journal articles, theses, conference papers and citation trails across many subjects.", "https://scholar.google.com/", "free", 1, true),
  resource("semantic-scholar", "Semantic Scholar", "Research papers", "Search academic papers and quickly identify key findings, citations and related research.", "https://www.semanticscholar.org/", "free", 2),
  resource("core", "CORE", "Research papers", "Discover freely available full-text research papers collected from repositories worldwide.", "https://core.ac.uk/", "free", 3, true),
  resource("doaj", "Directory of Open Access Journals", "Research papers", "Browse peer-reviewed open-access journals and articles without a subscription.", "https://doaj.org/", "free", 4),
  resource("researchgate", "ResearchGate", "Research papers", "Find publications, follow researchers and request full texts directly from authors.", "https://www.researchgate.net/", "freemium", 5),
  resource("pubmed", "PubMed", "Research papers", "Search trusted medical, nursing, health and biological research literature.", "https://pubmed.ncbi.nlm.nih.gov/", "free", 6),
  resource("ieee-xplore", "IEEE Xplore", "Research papers", "Explore computing, IT, engineering, electronics and AI publications; full access may require university login.", "https://ieeexplore.ieee.org/", "university", 7),
  resource("sciencedirect", "ScienceDirect", "Research papers", "Search journals and books across science, technology, business and social sciences.", "https://www.sciencedirect.com/", "university", 8),
  resource("springerlink", "SpringerLink", "Research papers", "Find research papers, academic books and conference proceedings across disciplines.", "https://link.springer.com/", "university", 9),
  resource("research4life", "Research4Life", "Research papers", "Eligible institutions can receive free or affordable access to academic publications; ask your university library.", "https://www.research4life.org/access/", "university", 10),

  resource("sljol", "Sri Lanka Journals Online", "Sri Lankan research", "Read Sri Lankan academic journals covering medicine, science, business and social sciences.", "https://www.sljol.info/", "free", 20, true),
  resource("nsf-repository", "NSF Digital Repository", "Sri Lankan research", "Find NSF-funded studies, conference material and locally published Sri Lankan research.", "https://dl.nsf.gov.lk/", "free", 21),
  resource("nsf-sri-lanka", "National Science Foundation Sri Lanka", "Sri Lankan research", "Access national research information, publications, programmes and scientific resources.", "https://www.nsf.gov.lk/", "free", 22),
  resource("aclk-repositories", "Sri Lankan university repositories", "Sri Lankan research", "Search ac.lk university repositories for local theses, dissertations and research papers in PDF format.", "https://www.google.com/search?q=site%3Aac.lk+filetype%3Apdf", "free", 23),
  resource("university-libraries", "University library databases", "Sri Lankan research", "Locate your university library databases and use your student account for subscribed journals and indexes.", "https://www.google.com/search?q=site%3Aac.lk+library+electronic+databases", "university", 24),

  resource("zotero", "Zotero", "References & citations", "Collect sources, store PDFs and create citations and bibliographies in thousands of styles.", "https://www.zotero.org/", "free", 30, true),
  resource("mendeley", "Mendeley Reference Manager", "References & citations", "Organize papers, annotate PDFs and create citations while you write.", "https://www.mendeley.com/", "free", 31),
  resource("mybib", "MyBib", "References & citations", "Generate citations for APA, Harvard, IEEE and other common styles in your browser.", "https://www.mybib.com/", "free", 32),
  resource("cite-this-for-me", "Cite This For Me", "References & citations", "Create references quickly, then check every generated entry against the original source.", "https://www.citethisforme.com/", "freemium", 33),
  resource("crossref", "Crossref Search", "References & citations", "Confirm DOI numbers and accurate publication details directly from scholarly metadata.", "https://search.crossref.org/", "free", 34),

  resource("grammarly", "Grammarly", "Writing & grammar", "Check English spelling, grammar, clarity and sentence structure while drafting.", "https://www.grammarly.com/students", "freemium", 40, true),
  resource("languagetool", "LanguageTool", "Writing & grammar", "A capable free grammar, spelling and style checker for academic writing.", "https://languagetool.org/", "freemium", 41),
  resource("hemingway", "Hemingway Editor", "Writing & grammar", "Identify dense sentences and make complicated English clearer and easier to read.", "https://hemingwayapp.com/", "freemium", 42),
  resource("quillbot", "QuillBot", "Writing & grammar", "Paraphrasing and grammar assistance that should be used carefully with the original source cited.", "https://quillbot.com/", "freemium", 43),
  resource("deepl", "DeepL Translator", "Writing & grammar", "Translate passages and improve sentence phrasing across supported languages.", "https://www.deepl.com/translator", "freemium", 44),
  resource("google-docs", "Google Docs", "Writing & grammar", "Collaborative writing with comments, revision history and automatic cloud saving.", "https://docs.google.com/", "free", 45, true),
  resource("word", "Microsoft Word", "Writing & grammar", "Format reports, citations, captions, tables of contents and page numbering online or on desktop.", "https://www.microsoft.com/en-us/microsoft-365/word", "university", 46),

  resource("chatgpt", "ChatGPT", "AI study tools", "Explain difficult concepts, develop outlines, review writing and explore coding or research directions.", "https://chatgpt.com/", "freemium", 50, true),
  resource("notebooklm", "NotebookLM", "AI study tools", "Upload your own papers and notes, then ask questions grounded in those sources.", "https://notebooklm.google/", "free", 51, true),
  resource("elicit", "Elicit", "AI study tools", "Support literature searches and extract structured evidence from research papers.", "https://elicit.com/", "freemium", 52),
  resource("consensus", "Consensus", "AI study tools", "Find research-based answers and follow the supporting academic studies.", "https://consensus.app/", "freemium", 53),
  resource("scispace", "SciSpace", "AI study tools", "Get help understanding papers, tables, formulas and difficult academic language.", "https://scispace.com/", "freemium", 54),
  resource("connected-papers", "Connected Papers", "AI study tools", "Explore a visual graph of related and influential academic papers.", "https://www.connectedpapers.com/", "freemium", 55),

  resource("google-forms", "Google Forms", "Surveys & data collection", "Create questionnaires and export responses to Google Sheets or Excel.", "https://forms.google.com/", "free", 60, true),
  resource("microsoft-forms", "Microsoft Forms", "Surveys & data collection", "Build surveys and quizzes with automatic response summaries.", "https://forms.microsoft.com/", "university", 61),
  resource("kobotoolbox", "KoboToolbox", "Surveys & data collection", "Collect field-research data online or offline using flexible forms.", "https://www.kobotoolbox.org/", "free", 62, true),
  resource("jotform", "Jotform", "Surveys & data collection", "Create advanced online forms from templates with conditional workflows.", "https://www.jotform.com/", "freemium", 63),
  resource("qualtrics", "Qualtrics", "Surveys & data collection", "Professional research surveys; check whether your university provides access.", "https://www.qualtrics.com/", "university", 64),

  resource("excel", "Microsoft Excel", "Data analysis", "Clean data, calculate descriptive statistics, build pivot tables and create charts.", "https://www.microsoft.com/en-us/microsoft-365/excel", "university", 70, true),
  resource("google-sheets", "Google Sheets", "Data analysis", "Free collaborative spreadsheets for formulas, charts and shared analysis.", "https://workspace.google.com/products/sheets/", "free", 71),
  resource("jasp", "JASP", "Data analysis", "A free SPSS-style tool for descriptive statistics, regression, ANOVA and hypothesis testing.", "https://jasp-stats.org/", "free", 72, true),
  resource("jamovi", "jamovi", "Data analysis", "Beginner-friendly free statistical software built for clear analyses and reproducible results.", "https://www.jamovi.org/", "free", 73),
  resource("rstudio", "R and RStudio", "Data analysis", "Powerful free tools for advanced statistics, visualization and reproducible research.", "https://posit.co/download/rstudio-desktop/", "free", 74),
  resource("colab", "Google Colab", "Data analysis", "Run Python notebooks for data science and machine learning without installing software.", "https://colab.research.google.com/", "free", 75, true),
  resource("orange", "Orange Data Mining", "Data analysis", "Free visual data analysis and machine learning with little or no coding.", "https://orangedatamining.com/", "free", 76),
  resource("spss", "IBM SPSS Statistics", "Data analysis", "Popular statistical analysis software that normally requires a paid or university licence.", "https://www.ibm.com/products/spss-statistics", "paid", 77),
  resource("power-bi", "Power BI Desktop", "Data analysis", "Build dashboards, data models and interactive visualizations on Windows.", "https://www.microsoft.com/en-us/download/details.aspx?id=58494", "free", 78),

  resource("github", "GitHub", "Programming", "Store code, track changes and collaborate safely with group members.", "https://github.com/", "freemium", 80, true),
  resource("github-student", "GitHub Student Developer Pack", "Programming", "Eligible students receive development tools, learning resources and partner offers.", "https://education.github.com/pack", "free", 81, true),
  resource("vscode", "Visual Studio Code", "Programming", "A free, extensible code editor for most programming languages.", "https://code.visualstudio.com/", "free", 82, true),
  resource("replit", "Replit", "Programming", "Write, run and share code directly from a web browser.", "https://replit.com/", "freemium", 83),
  resource("stackoverflow", "Stack Overflow", "Programming", "Find technical explanations and community answers to programming problems.", "https://stackoverflow.com/", "free", 84),
  resource("mdn", "MDN Web Docs", "Programming", "Reliable documentation and learning material for HTML, CSS and JavaScript.", "https://developer.mozilla.org/", "free", 85),
  resource("w3schools", "W3Schools", "Programming", "Beginner-friendly coding explanations, examples and browser exercises.", "https://www.w3schools.com/", "freemium", 86),
  resource("freecodecamp", "freeCodeCamp", "Programming", "Free programming lessons, certifications and practical projects.", "https://www.freecodecamp.org/", "free", 87),
  resource("matlab-online", "MATLAB Online", "Programming", "Run MATLAB in a browser when your university or personal licence includes access.", "https://matlab.mathworks.com/", "university", 88),

  resource("overleaf", "Overleaf", "Reports & formatting", "Create professional LaTeX reports, dissertations and documents with equations.", "https://www.overleaf.com/", "freemium", 90, true),
  resource("mathtype", "MathType", "Reports & formatting", "Write equations for Microsoft Word and other document applications.", "https://www.wiris.com/en/mathtype/", "paid", 91),
  resource("mathcha", "Mathcha", "Reports & formatting", "A free online equation, drawing and technical diagram editor.", "https://www.mathcha.io/", "free", 92),
  resource("tables-generator", "Tables Generator", "Reports & formatting", "Create clean LaTeX, HTML, Markdown and text tables in the browser.", "https://www.tablesgenerator.com/", "free", 93),
  resource("smallpdf", "Smallpdf", "Reports & formatting", "Convert, merge, compress and rearrange PDFs; avoid uploading confidential research.", "https://smallpdf.com/", "freemium", 94),
  resource("ilovepdf", "iLovePDF", "Reports & formatting", "Split, merge, convert and compress PDF files; keep unpublished work private.", "https://www.ilovepdf.com/", "freemium", 95, true),

  resource("canva", "Canva", "Presentations & diagrams", "Create presentations, research posters, infographics and assignment covers.", "https://www.canva.com/", "freemium", 100, true),
  resource("google-slides", "Google Slides", "Presentations & diagrams", "Build presentations collaboratively with comments and revision history.", "https://workspace.google.com/products/slides/", "free", 101),
  resource("powerpoint", "Microsoft PowerPoint", "Presentations & diagrams", "Create academic presentations with charts, animations and presenter tools.", "https://www.microsoft.com/en-us/microsoft-365/powerpoint", "university", 102),
  resource("diagrams-net", "diagrams.net", "Presentations & diagrams", "Create free flowcharts, UML, ER and network diagrams in a browser.", "https://app.diagrams.net/", "free", 103, true),
  resource("lucidchart", "Lucidchart", "Presentations & diagrams", "Design diagrams, process maps and system models; the free plan is limited.", "https://www.lucidchart.com/", "freemium", 104),
  resource("figma", "Figma", "Presentations & diagrams", "Create UI/UX designs, prototypes and collaborative design assignments.", "https://www.figma.com/", "freemium", 105),
  resource("miro", "Miro", "Presentations & diagrams", "Brainstorm, create mind maps and plan group projects on a shared canvas.", "https://miro.com/", "freemium", 106),

  resource("google-drive", "Google Drive", "Group work", "Share reports, datasets and presentations with controlled access.", "https://drive.google.com/", "free", 110, true),
  resource("microsoft-teams", "Microsoft Teams", "Group work", "Coordinate meetings, files and group communication in one workspace.", "https://www.microsoft.com/en-us/microsoft-teams/group-chat-software", "university", 111),
  resource("trello", "Trello", "Group work", "Divide assignment tasks, assign owners and monitor approaching deadlines.", "https://trello.com/", "freemium", 112),
  resource("notion", "Notion", "Group work", "Keep notes, research plans, task lists and project documentation together.", "https://www.notion.so/", "freemium", 113),
  resource("zoom", "Zoom", "Group work", "Hold online group discussions, screen-sharing sessions and project meetings.", "https://zoom.us/", "freemium", 114),
  resource("google-meet", "Google Meet", "Group work", "Start browser-based video meetings using a Google account.", "https://meet.google.com/", "free", 115)
];

export function resourceFavicon(url: string) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=128`;
  } catch {
    return "";
  }
}

export const RESOURCE_ACCESS_LABELS: Record<ResourceAccess, string> = {
  free: "Free",
  freemium: "Free plan",
  university: "University access",
  paid: "Paid",
  varies: "Access varies"
};

export function mergeStudentResources(rows: any[] = []) {
  const overrides = new Map(rows.map((row) => [String(row.resource_key), row]));
  const defaults = defaultStudentResources.flatMap((item) => {
    const override = overrides.get(item.id);
    if (override?.is_deleted) return [];
    if (!override) return [{ ...item, is_default: true }];
    overrides.delete(item.id);
    return [{
      ...item,
      ...override,
      id: String(override.resource_key),
      thumbnail_url: override.thumbnail_url || null,
      is_default: true
    }];
  });

  const custom = Array.from(overrides.values())
    .filter((row) => !row.is_deleted)
    .map((row) => ({
      id: String(row.resource_key),
      title: String(row.title),
      category: String(row.category),
      description: String(row.description),
      url: String(row.url),
      thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
      access_type: row.access_type as ResourceAccess,
      is_featured: Boolean(row.is_featured),
      is_published: Boolean(row.is_published),
      sort_order: Number(row.sort_order) || 0,
      is_default: false
    }));

  return [...defaults, ...custom].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
}
