<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAiSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Assume admin middleware is applied at route level
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('api_key')) {
            $this->merge([
                // Remove all whitespaces (spaces, tabs, newlines)
                'api_key' => preg_replace('/\s+/', '', $this->input('api_key')),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        $drivers = array_keys(config('llm.drivers', []));
        $driver = $this->input('driver');

        $chatModels = [];
        $embeddingModels = [];

        if (in_array($driver, $drivers)) {
            $chatModels = config("llm.drivers.{$driver}.chat_models", []);
            $embeddingModels = config("llm.drivers.{$driver}.embedding_models", []);
        }

        $rules = [
            'driver' => ['required', 'string', Rule::in($drivers)],
            'chat_model' => ['required', 'string', Rule::in($chatModels)],
            'embedding_model' => ['required', 'string', Rule::in($embeddingModels)],
        ];

        if ($driver === 'gemini') {
            $isConfigured = !empty(config('rag.gemini_api_key'));
            if ($isConfigured) {
                $rules['api_key'] = ['nullable', 'string'];
            } else {
                $rules['api_key'] = ['required', 'string'];
            }
        } elseif ($driver === 'ollama') {
            $rules['base_url'] = ['nullable', 'string', 'url'];
            // API key is not required for standard local Ollama
            $rules['api_key'] = ['nullable', 'string'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'chat_model.in' => 'The selected chat model is not supported for this driver.',
            'embedding_model.in' => 'The selected embedding model is not supported for this driver.',
        ];
    }
}
