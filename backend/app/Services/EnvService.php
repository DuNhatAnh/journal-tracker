<?php

namespace App\Services;

class EnvService
{
    /**
     * Set a single key-value pair in the .env file.
     */
    public function setKey(string $key, string $value): bool
    {
        return $this->setMany([$key => $value]);
    }

    /**
     * Set multiple key-value pairs in the .env file.
     */
    public function setMany(array $data): bool
    {
        $path = $this->getEnvPath();

        if (!file_exists($path)) {
            return false;
        }

        $envContent = file_get_contents($path);

        foreach ($data as $key => $value) {
            $value = $this->formatValue($value);
            
            // Check if key exists
            if (preg_match("/^{$key}=/m", $envContent)) {
                // Replace existing key
                $envContent = preg_replace(
                     "/^{$key}=.*/m",
                     "{$key}={$value}",
                     $envContent
                );
            } else {
                // Append new key
                $envContent .= "\n{$key}={$value}";
            }
        }

        // Clean up any double newlines created at the end
        $envContent = rtrim($envContent) . "\n";

        return file_put_contents($path, $envContent) !== false;
    }

    /**
     * Delete a key from the .env file.
     */
    public function deleteKey(string $key): bool
    {
        $path = $this->getEnvPath();

        if (!file_exists($path)) {
            return false;
        }

        $envContent = file_get_contents($path);

        // Remove the key and its value
        $envContent = preg_replace("/^{$key}=.*\n?/m", '', $envContent);

        return file_put_contents($path, $envContent) !== false;
    }

    /**
     * Check if a key exists in the .env file.
     */
    public function hasKey(string $key): bool
    {
        $path = $this->getEnvPath();

        if (!file_exists($path)) {
            return false;
        }

        $envContent = file_get_contents($path);

        return preg_match("/^{$key}=/m", $envContent) === 1;
    }

    /**
     * Get the current value of a key from the .env file.
     */
    public function getKey(string $key): ?string
    {
        $path = $this->getEnvPath();

        if (!file_exists($path)) {
            return null;
        }

        $envContent = file_get_contents($path);

        if (preg_match("/^{$key}=(.*)$/m", $envContent, $matches)) {
            return trim($matches[1], '"\'');
        }

        return null;
    }

    /**
     * Format a value for the .env file (wrap in quotes if it contains spaces).
     */
    private function formatValue(string $value): string
    {
        if (preg_match('/\s/', $value) || str_contains($value, '=')) {
            return '"' . addslashes($value) . '"';
        }
        
        return $value;
    }

    /**
     * Get the active environment file path.
     */
    private function getEnvPath(): string
    {
        $isTesting = false;
        foreach (debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS) as $trace) {
            if (isset($trace['class']) && (str_starts_with($trace['class'], 'Tests\\') || str_starts_with($trace['class'], 'PHPUnit\\'))) {
                $isTesting = true;
                break;
            }
        }

        $path = $isTesting
            ? base_path('.env.testing')
            : base_path('.env');

        if ($isTesting && !file_exists($path)) {
            file_put_contents($path, '');
        }

        return $path;
    }
}
