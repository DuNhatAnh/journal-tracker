<?php

namespace App\Exceptions;

use RuntimeException;

class AiServiceException extends RuntimeException
{
    // Ngoại lệ này sẽ được ném ra khi giao tiếp với AI Provider thất bại.
    // Laravel Queue sẽ bắt ngoại lệ này để tự động retry Job.
}
