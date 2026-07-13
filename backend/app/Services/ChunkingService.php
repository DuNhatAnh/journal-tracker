<?php

namespace App\Services;

class ChunkingService
{
    /**
     * Ghép title và abstract, sau đó cắt thành các chunk theo câu.
     *
     * @param string $title
     * @param string|null $abstract
     * @param int $targetChunkSize Kích thước tối đa của mỗi chunk (ví dụ 600 ký tự)
     * @param int $targetOverlapSize Kích thước mục tiêu phần overlap (ví dụ 150 ký tự)
     * @return list<string> Mảng các chunk
     */
    public function chunk(string $title, ?string $abstract, int $targetChunkSize = 600, int $targetOverlapSize = 150): array
    {
        if (empty(trim($title)) && empty(trim($abstract ?? ''))) {
            return [];
        }

        $text = trim($title);
        
        if (!empty($abstract)) {
            $abstract = trim($abstract);
            // Thêm dấu chấm nếu chưa có dấu câu kết thúc
            if (!empty($text) && !preg_match('/[.!?]$/u', $text)) {
                $text .= '.';
            }
            $text .= (empty($text) ? '' : ' ') . $abstract;
        }

        // 1. Tách văn bản thành các câu.
        $sentences = preg_split('/(?<=[.!?])\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY);
        if (empty($sentences)) {
            $sentences = [$text];
        }

        // 2. Tiền xử lý: Đảm bảo không có câu nào dài hơn targetChunkSize.
        // Nếu có, cắt nó thành các cụm từ (tokens) nhỏ hơn theo khoảng trắng, hoặc cắt cứng theo ký tự.
        $tokens = [];
        foreach ($sentences as $sentence) {
            $sentence = trim($sentence);
            if (empty($sentence)) continue;
            
            if (mb_strlen($sentence) <= $targetChunkSize) {
                $tokens[] = $sentence;
            } else {
                // Cắt theo từ (khoảng trắng)
                $words = preg_split('/\s+/u', $sentence, -1, PREG_SPLIT_NO_EMPTY);
                $tempToken = '';
                foreach ($words as $word) {
                    $wordLen = mb_strlen($word);
                    // Nếu bản thân một từ dài hơn cả ChunkSize (rất hiếm, VD: chuỗi DNA/URL)
                    if ($wordLen > $targetChunkSize) {
                        if (!empty($tempToken)) {
                            $tokens[] = $tempToken;
                            $tempToken = '';
                        }
                        $offset = 0;
                        while ($offset < $wordLen) {
                            $part = mb_substr($word, $offset, $targetChunkSize);
                            if (mb_strlen($part) === $targetChunkSize) {
                                $tokens[] = $part;
                            } else {
                                $tempToken = $part;
                            }
                            $offset += $targetChunkSize;
                        }
                    } else {
                        $addedLen = mb_strlen($tempToken) + ($tempToken === '' ? 0 : 1) + $wordLen;
                        if ($addedLen > $targetChunkSize) {
                            $tokens[] = $tempToken;
                            $tempToken = $word;
                        } else {
                            $tempToken .= ($tempToken === '' ? '' : ' ') . $word;
                        }
                    }
                }
                if (!empty($tempToken)) {
                    $tokens[] = $tempToken;
                }
            }
        }

        // 3. Gom các tokens thành chunk
        $chunks = [];
        $currentChunkText = '';

        foreach ($tokens as $token) {
            $tokenLength = mb_strlen($token);
            $currentLength = mb_strlen($currentChunkText);

            // Nếu thêm token này vào sẽ vượt quá giới hạn
            if ($currentLength > 0 && ($currentLength + 1 + $tokenLength) > $targetChunkSize) {
                // Lưu chunk hiện tại
                $chunks[] = $currentChunkText;

                // Tính toán overlap bám sát 150 ký tự nhất có thể bằng cách lấy lùi từng từ
                $overlapText = '';
                // Điều chỉnh Overlap để đảm bảo overlap + token không vượt quá giới hạn
                $adjustedOverlapSize = min($targetOverlapSize, max(0, $targetChunkSize - $tokenLength - 1));

                if ($adjustedOverlapSize > 0) {
                    $overlapWords = preg_split('/\s+/u', $currentChunkText, -1, PREG_SPLIT_NO_EMPTY);
                    $accumulated = '';
                    for ($i = count($overlapWords) - 1; $i >= 0; $i--) {
                        $word = $overlapWords[$i];
                        $projectedLength = mb_strlen($accumulated) + ($accumulated === '' ? 0 : 1) + mb_strlen($word);
                        
                        // Dừng nếu thêm từ này vào sẽ vượt quá Overlap cho phép
                        if ($accumulated !== '' && $projectedLength > $adjustedOverlapSize) {
                            break;
                        }
                        $accumulated = $word . ($accumulated === '' ? '' : ' ') . $accumulated;
                    }
                    $overlapText = $accumulated;
                }

                // Bắt đầu chunk mới
                $currentChunkText = (!empty($overlapText) ? $overlapText . ' ' : '') . $token;
            } else {
                // Thêm token vào chunk hiện tại
                $currentChunkText .= (!empty($currentChunkText) ? ' ' : '') . $token;
            }
        }

        // Lưu chunk cuối cùng
        if (!empty($currentChunkText)) {
            $chunks[] = $currentChunkText;
        }

        return $chunks;
    }
}
