<?php

namespace Tests\Feature;

use App\Exceptions\AiServiceException;
use App\Interfaces\RagServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Tests\TestCase;
use PDOException;
use Exception;

class ExceptionMappingTest extends TestCase
{
    use RefreshDatabase;

    private $ragServiceMock;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock RagService so we can force it to throw exceptions
        $this->ragServiceMock = $this->createMock(RagServiceInterface::class);
        $this->app->instance(RagServiceInterface::class, $this->ragServiceMock);
    }

    public function test_validation_exception_mapping()
    {
        $response = $this->postJson('/api/chat', []); // Missing question

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Dữ liệu không hợp lệ.',
                ]
            ])
            ->assertJsonStructure(['error' => ['requestId', 'details' => ['question']]]);
    }

    public function test_invalid_argument_exception_mapping()
    {
        $this->ragServiceMock->expects($this->once())
            ->method('generateAnswer')
            ->willThrowException(new InvalidArgumentException('Custom bad request message'));

        $response = $this->postJson('/api/chat', ['question' => 'test_question']);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_ARGUMENT',
                    'message' => 'Custom bad request message',
                ]
            ])
            ->assertJsonStructure(['error' => ['requestId', 'details']]);
    }

    public function test_model_not_found_exception_mapping()
    {
        $this->ragServiceMock->expects($this->once())
            ->method('generateAnswer')
            ->willThrowException(new ModelNotFoundException());

        $response = $this->postJson('/api/chat', ['question' => 'test_question']);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Không tìm thấy dữ liệu.',
                ]
            ]);
    }

    public function test_ai_service_exception_mapping()
    {
        $this->ragServiceMock->expects($this->once())
            ->method('generateAnswer')
            ->willThrowException(new AiServiceException('Gemini is down'));

        $response = $this->postJson('/api/chat', ['question' => 'test_question']);

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'AI_SERVICE_ERROR',
                    'message' => 'Dịch vụ AI đang gián đoạn, vui lòng thử lại sau.',
                ]
            ]);
    }

    public function test_query_exception_mapping()
    {
        // Mock a QueryException
        $exception = new QueryException('test_connection', 'SELECT * FROM invalid_table', [], new \Exception('Base exception'));
        
        $this->ragServiceMock->expects($this->once())
            ->method('generateAnswer')
            ->willThrowException($exception);

        $response = $this->postJson('/api/chat', ['question' => 'test_question']);

        $response->assertStatus(500)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'DATABASE_ERROR',
                    'message' => 'Lỗi hệ thống cơ sở dữ liệu.',
                ]
            ]);
        
        // Ensure SQL is not leaked
        $this->assertStringNotContainsString('invalid_table', $response->getContent());
    }

    public function test_general_exception_mapping()
    {
        $this->ragServiceMock->expects($this->once())
            ->method('generateAnswer')
            ->willThrowException(new Exception('Some random error'));

        $response = $this->postJson('/api/chat', ['question' => 'test_question']);

        $response->assertStatus(500)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_SERVER_ERROR',
                    'message' => 'Đã có lỗi hệ thống xảy ra.',
                ]
            ]);
        
        // Ensure stack trace is not leaked
        $this->assertStringNotContainsString('Some random error', $response->getContent());
    }
}
