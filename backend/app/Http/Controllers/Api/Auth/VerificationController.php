<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class VerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(Request $request)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $user = User::find($request->route('id'));

        if (!$user) {
            return redirect($frontendUrl . '/login?error=' . urlencode('Người dùng không tồn tại.'));
        }

        if (!hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return redirect($frontendUrl . '/login?error=' . urlencode('Đường dẫn xác nhận không hợp lệ hoặc đã hết hạn.'));
        }

        if ($user->hasVerifiedEmail()) {
            return redirect($frontendUrl . '/login?message=' . urlencode('Tài khoản này đã được xác thực trước đó.'));
        }

        $user->markEmailAsVerified();

        return redirect($frontendUrl . '/login?message=' . urlencode('Xác thực tài khoản thành công!'));
    }

    /**
     * Resend the email verification notification.
     */
    public function resend(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Người dùng không tồn tại.'], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Tài khoản này đã được xác thực trước đó.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Đường dẫn xác nhận đã được gửi lại vào email của bạn.']);
    }
}
