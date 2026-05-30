<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            return redirect($frontendUrl . '/login?error=' . urlencode('Đăng nhập bằng Google thất bại. Vui lòng thử lại.'));
        }

        // Find or create the user
        $user = User::where('email', $googleUser->getEmail())->first();
        $isNew = false;

        if (!$user) {
            $user = User::create([
                'name'     => $googleUser->getName() ?? $googleUser->getNickname() ?? 'Google User',
                'email'    => $googleUser->getEmail(),
                'password' => Hash::make(Str::random(24)),
                'role'     => 'student', // Default role for new signups
                'avatar'   => $googleUser->getAvatar(),
            ]);
            $isNew = true;
        } else {
            // Update avatar if they don't have one
            if (!$user->avatar && $googleUser->getAvatar()) {
                $user->update(['avatar' => $googleUser->getAvatar()]);
            }
        }

        // Create Sanctum Token
        $token = $user->createToken('auth_token')->plainTextToken;

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        
        // Build user data array to pass to frontend
        $userData = [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'avatar'         => $user->avatar,
            'academic_title' => $user->academic_title,
        ];

        $redirectUrl = $frontendUrl . '/sso-callback?token=' . urlencode($token) . '&user=' . urlencode(json_encode($userData));
        if ($isNew) {
            $redirectUrl .= '&is_new=1';
        }

        return redirect($redirectUrl);
    }

    /**
     * Update user's role on registration.
     */
    public function selectRole(Request $request)
    {
        $request->validate([
            'role' => ['required', 'in:student,lecturer,researcher'],
        ]);

        $user = $request->user();
        $user->update([
            'role' => $request->role,
        ]);

        // Build updated user data array to pass to frontend
        $userData = [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'avatar'         => $user->avatar,
            'academic_title' => $user->academic_title,
        ];

        return response()->json([
            'message' => 'Cập nhật vai trò thành công.',
            'user'    => $userData,
        ]);
    }
}
