import * as cheerio from 'cheerio';

export interface AnalysisResults {
  report: string;
  summary: Summary;
}

export interface Summary {
  riskLevel: 'low' | 'medium' | 'high';
  riskColor: 'green' | 'yellow' | 'red';
  summary: string;
  recommendation: 'install' | 'proceed with caution' | 'avoid';
  keyPoints: string[];
  topConcerns: string[];
  commentsFYI: string;
}

export interface PkgData {
  build: string;
  metadata: {
    ID: number;
    Name: string;
    Description: string | null;
    PackageBaseID: number;
    PackageBase: string;
    Maintainer: string | null;
    NumVotes: number;
    Popularity: number;
    FirstSubmitted: number;
    LastModified: number;
    OutOfDate: string | null;
    Version: string;
    URLPath: string | null;
    URL: string | null;
    Submitter: string;
    License: string[];
    Depends: string[];
    MakeDepends: string[];
    OptDepends: string[];
    CheckDepends: string[];
    Provides: string[];
    Conflicts: string[];
    Replaces: string[];
    Groups: string[];
    Keywords: string[];
    CoMaintainers: string[];
  };
  comments: Comment[];
}

interface Comment {
  id: number;
  date: string;
  username: string;
  content: string;
  fromPage: number;
  pinned: boolean;
}

interface AurWebRPCResponse {
  resultcount: number;
  type: string;
  version: number;
  results: PkgData['metadata'];
}

const PKGBUILD_BASE_URL =
  'https://aur.archlinux.org/cgit/aur.git/plain/PKGBUILD?h=';

export async function getPkgbuild(packageName: string) {
  const pkgbuildUrl = `${PKGBUILD_BASE_URL}${packageName}`;

  const pkgbuildResponse = await fetch(pkgbuildUrl);
  const pkgbuild = await pkgbuildResponse.text();

  return pkgbuild.trim();
}

export async function getPkgMetadata(packageName: string) {
  const aurWebRPCResponse = await fetch(
    `https://aur.archlinux.org/rpc/v5/info/${packageName}`,
    {
      method: 'GET',
    }
  );

  if (!aurWebRPCResponse.ok) {
    throw new Error('Failed to fetch package metadata');
  }

  const metadata = (await aurWebRPCResponse.json()) as AurWebRPCResponse;

  return metadata.results;
}

export async function getPkgComments(packageName: string): Promise<Comment[]> {
  const pkgURL = `https://aur.archlinux.org/packages/${packageName}`;
  let page = 0;
  let allComments: Comment[] = [];

  // we are only getting the first 3 pages of comments
  while (page <= 30) {
    const response = await fetch(`${pkgURL}?O=${page}`);
    if (!response.ok) {
      console.error(`failed fetching page at offset ${page}`);
      break;
    }
    const pageHTML = await response.text();
    const commentsOnPage = parseCommentsFromHTML(pageHTML, page);
    if (commentsOnPage.length === 0) {
      break;
    }
    allComments = allComments.concat(commentsOnPage);
    page += 10;
  }

  return allComments;
}

// thank you o3 for this function
function parseCommentsFromHTML(html: string, fromPage: number): Comment[] {
  const $ = cheerio.load(html);
  const comments: Comment[] = [];
  // there are two comment sections on the page: first for pinned,
  // second for latest - only on the first page.
  $('.comments.package-comments').each((sectionIndex, sectionElem) => {
    // mark as pinned if we are on the first page and this is the first section
    const isPinned = fromPage === 0 && sectionIndex === 0;
    $(sectionElem)
      .find('h4.comment-header')
      .each((i, header) => {
        const headerId = $(header).attr('id'); // e.g. "comment-910450"
        let id = 0;
        if (headerId) {
          const match = headerId.match(/\d+/);
          if (match) {
            id = parseInt(match[0], 10);
          }
        }

        // the header text is like "username commented on ..." => extract username
        const headerText = $(header).text().replace(/\s+/g, ' ').trim();
        let username = '';
        const usernameMatch = headerText.match(/^(.+?) commented on/);
        if (usernameMatch) {
          username = usernameMatch[1].trim();
        }

        // extract date from the anchor with the class "date"
        const date = $(header).find('a.date').text().trim();

        // the comment content is in a div with an id like "comment-xxxxx-content"
        let content = '';
        if (headerId) {
          content = $(`#${headerId}-content`).text().trim();
        }

        comments.push({
          id,
          username,
          date,
          content,
          fromPage,
          pinned: isPinned,
        });
      });
  });

  return comments;
}

// // Function that calls all models and returns comparison results
// export const compareModels = async (pkgData: PkgData, env: Env) => {
//   const openai = createOpenAI({
//     apiKey: env.OPENAI_API_KEY,
//   });

//   const google = createGoogleGenerativeAI({
//     apiKey: env.GOOGLE_API_KEY,
//   });

//   const models = getModels(openai, google);

//   // Flatten models object into array of model configs
//   const modelConfigs = Object.entries(models.models.openai.models)
//     .map(([name, model]) => ({
//       name,
//       model,
//     }))
//     .concat(
//       Object.entries(models.models.google.models).map(([name, model]) => ({
//         name,
//         model,
//       }))
//     );

//   // Run analysis with each model
//   const results = await Promise.all(
//     modelConfigs.map(async ({ name, model }) => {
//       const { text } = await generateText({
//         model,
//         system: reportSystemPrompt,
//         messages: [
//           {
//             role: 'user',
//             content: `Analyze the following package and provide a detailed report:

//         Metadata: ${JSON.stringify(pkgData.metadata, null, 2)}
//         PKGBUILD: ${JSON.stringify(pkgData.build, null, 2)}
//         Comments: ${JSON.stringify(pkgData.comments, null, 2)}`,
//           },
//         ],
//       });

//       return {
//         model: name,
//         result: text,
//       };
//     })
//   );

//   return results;
// };
