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
            'query' => ['required', 'string', 'min:2', 'max:200'],
        ]);

        $query = $request->input('query');
        $searchQuery = $query;

        if ($this->isVietnamese($query)) {
            $searchQuery = $this->translateToEnglish($query);
        }

        // 1. Search for related papers using vector embedding similarity search
        try {
            // Using a threshold of 0.38 to capture broad relationships
            $retrievalResults = $this->retrievalService->search($searchQuery, 6, 0.38);
            $paperIds = array_map(fn($r) => $r->paperId, $retrievalResults);
        } catch (\Exception $e) {
            $paperIds = [];
        }

        // Fallback to text search if no matches found via vector similarity
        if (empty($paperIds)) {
            $papers = ResearchPaper::search($searchQuery)->with(['keywords', 'authors'])->limit(6)->get();
        } else {
            $papers = ResearchPaper::whereIn('id', $paperIds)->with(['keywords', 'authors'])->get();
        }

        // 2. Build graph data structure
        $nodes = [];
        $links = [];

        // Root Node (Search Query)
        $rootId = 'root';
        $nodes[] = [
            'id' => $rootId,
            'label' => $query,
            'type' => 'root',
            'val' => 30, // Size indicator
        ];

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
