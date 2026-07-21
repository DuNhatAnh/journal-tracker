<?php

namespace App\Http\Controllers;

use App\Models\Keyword;
use App\Models\ResearchPaper;
use App\Interfaces\RetrievalServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResearchExplorerController extends Controller
{
    public function __construct(
        protected RetrievalServiceInterface $retrievalService
    ) {}

    /**
     * Explore research papers and keywords as a graph tree.
     */
    public function explore(Request $request): JsonResponse
    {
        $request->validate([
            'query' => ['required_without:paper_id', 'string', 'min:2', 'max:20000'],
            'paper_id' => ['required_without:query', 'integer', 'exists:research_papers,id'],
        ]);

        $paperId = $request->input('paper_id');
        $seedPaper = null;

        if ($paperId) {
            $seedPaper = ResearchPaper::with(['keywords', 'authors'])->findOrFail($paperId);
            $query = $seedPaper->title;
            $searchQuery = $seedPaper->title . " " . $seedPaper->abstract;
        } else {
            $query = $request->input('query');
            $searchQuery = $query;

            if ($this->isVietnamese($query)) {
                $searchQuery = $this->translateToEnglish($query);
            }
        }

        // 1. Search for related papers using vector embedding similarity search
        try {
            // Fetch more chunks (e.g., 30) with a threshold of 0.38 to ensure we get enough unique and relevant papers
            $retrievalResults = $this->retrievalService->search($searchQuery, 30, 0.38);
            
            // Extract paper IDs and remove duplicates
            $paperIds = array_unique(array_map(fn($r) => $r->paperId, $retrievalResults));
            
            // Remove the seed paper from the results if it exists
            if ($seedPaper) {
                $paperIds = array_filter($paperIds, fn($id) => $id !== $seedPaper->id);
            }
            
            // Take the top 6 unique papers
            $paperIds = array_slice(array_values($paperIds), 0, 6);
        } catch (\Exception $e) {
            $paperIds = [];
        }

        // Fallback to text search if no matches found via vector similarity
        if (empty($paperIds)) {
            $papersQuery = ResearchPaper::search($searchQuery);
            if ($seedPaper) {
                $papersQuery = $papersQuery->where('id', '!=', $seedPaper->id);
            }
            $papers = $papersQuery->with(['keywords', 'authors'])->limit(6)->get();
        } else {
            $papersQuery = ResearchPaper::whereIn('id', $paperIds);
            if ($seedPaper) {
                $papersQuery = $papersQuery->where('id', '!=', $seedPaper->id);
            }
            $papers = $papersQuery->with(['keywords', 'authors'])->get();
        }

        // 2. Build graph data structure
        $nodes = [];
        $links = [];

        // Root Node (Search Query or Seed Paper)
        if ($seedPaper) {
            $rootId = 'paper_' . $seedPaper->id;
            $nodes[] = [
                'id' => $rootId,
                'label' => $seedPaper->title,
                'type' => 'root',
                'val' => 30, // Size indicator
                'metadata' => [
                    'id' => $seedPaper->id,
                    'title' => $seedPaper->title,
                    'publishedYear' => $seedPaper->published_year,
                    'citationsCount' => $seedPaper->citations_count,
                    'doi' => $seedPaper->doi,
                    'abstract' => $seedPaper->abstract,
                    'authors' => $seedPaper->authors->pluck('name')->toArray(),
                ]
            ];
        } else {
            $rootId = 'root';
            $nodes[] = [
                'id' => $rootId,
                'label' => $query,
                'type' => 'root',
                'val' => 30, // Size indicator
            ];
        }

        // Fetch co-occurring keywords/topics in these papers
        $keywords = Keyword::whereHas('papers', function ($q) use ($papers) {
            $q->whereIn('id', $papers->pluck('id'));
        })
        ->limit(4)
        ->get();

        // Create Keyword Nodes and Link to Root
        foreach ($keywords as $kw) {
            $kwNodeId = 'kw_' . $kw->id;
            
            $nodes[] = [
                'id' => $kwNodeId,
                'label' => $kw->name,
                'type' => 'topic',
                'val' => 22,
            ];
            
            $links[] = [
                'source' => $rootId,
                'target' => $kwNodeId,
            ];

            // Connect matching papers to this keyword
            $kwPapers = $papers->filter(fn($p) => $p->keywords->contains('id', $kw->id));
            foreach ($kwPapers as $paper) {
                $paperNodeId = 'paper_' . $paper->id;
                
                // Add paper node if not already added
                if (!collect($nodes)->contains('id', $paperNodeId)) {
                    $nodes[] = [
                        'id' => $paperNodeId,
                        'label' => $paper->title,
                        'type' => 'paper',
                        'val' => 16,
                        'metadata' => [
                            'id' => $paper->id,
                            'title' => $paper->title,
                            'publishedYear' => $paper->published_year,
                            'citationsCount' => $paper->citations_count,
                            'doi' => $paper->doi,
                            'abstract' => $paper->abstract,
                            'authors' => $paper->authors->pluck('name')->toArray(),
                        ]
                    ];
                }

                $links[] = [
                    'source' => $kwNodeId,
                    'target' => $paperNodeId,
                ];
            }
        }

        // Connect remaining papers (without top 4 keywords) directly to the Root
        foreach ($papers as $paper) {
            $paperNodeId = 'paper_' . $paper->id;
            
            // Check if paper node already added
            $hasNode = collect($nodes)->contains('id', $paperNodeId);

            if (!$hasNode) {
                $nodes[] = [
                    'id' => $paperNodeId,
                    'label' => $paper->title,
                    'type' => 'paper',
                    'val' => 16,
                    'metadata' => [
                        'id' => $paper->id,
                        'title' => $paper->title,
                        'publishedYear' => $paper->published_year,
                        'citationsCount' => $paper->citations_count,
                        'doi' => $paper->doi,
                        'abstract' => $paper->abstract,
                        'authors' => $paper->authors->pluck('name')->toArray(),
                    ]
                ];

                $links[] = [
                    'source' => $rootId,
                    'target' => $paperNodeId,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'nodes' => $nodes,
                'links' => $links,
            ],
        ]);
    }

    private function isVietnamese(string $text): bool
    {
        return (bool) preg_match('/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/u', $text);
    }

    private function translateToEnglish(string $text): string
    {
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(3)->get('https://translate.googleapis.com/translate_a/single', [
                'client' => 'gtx',
                'sl' => 'vi',
                'tl' => 'en',
                'dt' => 't',
                'q' => $text
            ]);
            if ($response->successful()) {
                $data = $response->json();
                if (isset($data[0][0][0])) {
                    return trim($data[0][0][0]);
                }
            }
        } catch (\Throwable $e) {
            // Fallback
        }
        return $text;
    }
}
