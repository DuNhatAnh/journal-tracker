<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;

class AuthController extends Controller
{
    /**
     * POST /api/register
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'email', 'unique:users'],
            'password'              => ['required', 'min:8', 'confirmed'],
            'role'                  => ['required', 'in:researcher,lecturer,student'],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        $user->sendEmailVerificationNotification();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * POST /api/login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => 'Email hoặc mật khẩu không đúng.',
            ]);
        }

        $user  = Auth::user();
        
        if (!$user->hasVerifiedEmail()) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email để kích hoạt.',
            ]);
        }

        if (!in_array($user->role, ['admin', 'researcher', 'lecturer', 'student'])) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Tài khoản không có quyền truy cập ứng dụng.',
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Đăng xuất thành công.']);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * POST /api/profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'email'          => ['required', 'email', 'unique:users,email,' . $user->id],
            'academic_title' => ['nullable', 'string', 'max:255'],
            'dob'            => ['nullable', 'date'],
            'phone'          => ['nullable', 'string', 'max:20'],
            'gender'         => ['nullable', 'string', 'in:Nam,Nữ,Khác,Male,Female,Other'],
            'institution'    => ['nullable', 'string', 'max:255'],
            'bio'            => ['nullable', 'string'],
            'website'        => ['nullable', 'string', 'max:255'],
            'avatar'         => ['nullable', 'image', 'max:2048'], // Max 2MB
        ]);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = '/storage/' . $path;
        }

        $user->update($validated);

        return response()->json($user);
    }

    /**
     * DELETE /api/avatar
     */
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();

        // Xóa file khỏi storage nếu tồn tại
        if ($user->avatar) {
            $relativePath = ltrim(str_replace('/storage/', '', $user->avatar), '/');
            \Illuminate\Support\Facades\Storage::disk('public')->delete($relativePath);
        }

        $user->update(['avatar' => null]);

        return response()->json($user);
    }

    /**
     * POST /api/password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Đổi mật khẩu thành công.']);
    }

    /**
     * DELETE /api/user/account
     */
    public function deleteAccount(Request $request)
    {
        $user = $request->user();

        // Xoá mềm (nếu user dùng SoftDeletes) hoặc xoá cứng.
        // Ở đây user xác nhận xoá cứng.
        
        // Xóa file avatar khỏi storage nếu có
        if ($user->avatar) {
            $relativePath = ltrim(str_replace('/storage/', '', $user->avatar), '/');
            \Illuminate\Support\Facades\Storage::disk('public')->delete($relativePath);
        }

        // Đăng xuất và huỷ token
        $user->tokens()->delete();
        Auth::guard('web')->logout();

        // Xoá user
        $user->delete();

        return response()->json(['message' => 'Tài khoản đã được xoá vĩnh viễn.']);
    }
}
