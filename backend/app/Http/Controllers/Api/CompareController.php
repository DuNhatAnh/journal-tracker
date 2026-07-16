<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Interfaces\LlmServiceInterface;
use App\Models\ResearchPaper;
use App\Models\PaperChunk;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CompareController extends Controller
{
    public function __construct(
        private readonly LlmServiceInterface $llmService
    ) {}

    /**
     * Compare multiple research papers using LLM.
     */
    public function compare(Request $request): JsonResponse
    {
        $request->validate([
            'paper_ids' => 'required|array|min:2|max:3',
            'paper_ids.*' => 'required|integer|exists:research_papers,id'
        ]);

        $paperIds = $request->input('paper_ids');
        $papers = ResearchPaper::with('authors')->whereIn('id', $paperIds)->get();

        $prompt = "Bạn là trợ lý AI chuyên gia phân tích học thuật trên hệ thống SciTrend. Hãy lập bảng đối chiếu so sánh chi tiết giữa các bài báo khoa học sau đây:\n\n";

        foreach ($papers as $index => $paper) {
            $chunks = PaperChunk::where('paper_id', $paper->id)->get();
            $contextText = "";
            foreach ($chunks as $chunk) {
                $contextText .= $chunk->content . "\n\n";
            }
            if (empty($contextText)) {
                $contextText = "Abstract: " . $paper->abstract;
            }

            // Keep context per paper limited to avoid LLM context overflow
            $limitedContext = mb_substr($contextText, 0, 4000);

            $prompt .= "=== BÀI BÁO " . ($index + 1) . " ===\n"
                . "ID: " . $paper->id . "\n"
                . "Tiêu đề: " . $paper->title . "\n"
                . "Tác giả: " . $paper->authors->pluck('name')->implode(', ') . "\n"
                . "Năm xuất bản: " . $paper->published_year . "\n"
                . "Nội dung tóm lược/đoạn trích:\n"
                . $limitedContext . "\n\n";
        }

        $prompt .= "--- YÊU CẦU SO SÁNH ---\n"
            . "Hãy viết một báo cáo so sánh đối chiếu ngắn gọn bằng tiếng Việt dưới định dạng Markdown, bao gồm:\n"
            . "1. Một bảng Markdown (Markdown Table) so sánh các bài báo theo các tiêu chí học thuật:\n"
            . "   - Mục tiêu nghiên cứu (Research Objective)\n"
            . "   - Phương pháp/Thuật toán đề xuất (Methodology)\n"
            . "   - Tập dữ liệu thực nghiệm sử dụng (Datasets)\n"
            . "   - Yêu cầu phần cứng & Độ phức tạp tính toán (Compute Complexity/Parameters)\n"
            . "   - Chỉ số hiệu năng đạt được (Performance Metrics)\n"
            . "   - Ưu điểm nổi bật (Pros)\n"
            . "   - Hạn chế & Khoảng trống nghiên cứu chưa giải quyết được (Cons & Research Gaps)\n"
            . "   * ĐIỀU KIỆN RÀNG BUỘC:\n"
            . "     - TOÀN BỘ nội dung trong tất cả các ô của bảng phải được viết bằng TIẾNG VIỆT (hãy tự động dịch thông tin học thuật từ tiếng Anh sang tiếng Việt). Tuyệt đối không được viết nửa Anh nửa Việt hoặc trả về tiếng Anh.\n"
            . "     - Tuyệt đối không được lẫn lộn thông tin giữa các bài báo. Cột của Bài báo X chỉ chứa thông tin rút trích từ đúng Bài báo X.\n"
            . "     - Đối với các thông số kỹ thuật nếu tài liệu không ghi rõ, hãy đưa ra suy luận học thuật cực kỳ ngắn gọn bằng tiếng Việt (ví dụ: mô hình dịch tễ SIR, GPU biên...) hoặc ghi 'Chưa rõ (suy luận: ...)'.\n"
            . "     - KHÔNG viết thêm bất kỳ phần nhận xét tổng quan hay lời khuyên dài dòng bên dưới bảng để tối ưu hóa tối đa tốc độ tạo của mô hình.\n"
            . "     - GIỚI HẠN: Nội dung trong mỗi ô của bảng KHÔNG QUÁ 15 từ (1-2 câu ngắn). Càng ngắn gọn súc tích càng tốt.\n\n"
            . "Hãy trả về trực tiếp bảng Markdown, không giải thích gì thêm.";

        try {
            $aiResponse = $this->llmService->generate($prompt);
            return response()->json([
                'success' => true,
                'data' => [
                    'markdownTable' => $aiResponse->content,
                    'papers' => $papers->map(function ($paper) {
                        return [
                            'id' => $paper->id,
                            'title' => $paper->title,
                            'published_year' => $paper->published_year,
                            'authors' => $paper->authors->map(fn($a) => ['name' => $a->name]),
                        ];
                    })
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi gọi dịch vụ AI so sánh: ' . $e->getMessage()
            ], 500);
        }
    }
}
