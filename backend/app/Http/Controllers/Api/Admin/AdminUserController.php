<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index()
    {
        return response()->json(User::where('email', '!=', 'admin@journaltracker.app')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'required|string',
        ]);

        $validated['password'] = bcrypt($validated['password']);
        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        if ($user->email === 'admin@journaltracker.app') {
            abort(403, 'Không được phép xem thông tin tài khoản này.');
        }
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        if ($user->email === 'admin@journaltracker.app') {
            abort(403, 'Không thể thay đổi tài khoản quản trị tối cao.');
        }

        if (strtolower($user->role) === 'admin' && $request->user()->email !== 'admin@journaltracker.app') {
            abort(403, 'Chỉ tài khoản admin gốc mới được phép chỉnh sửa Admin khác.');
        }

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'role'  => 'sometimes|string',
        ]);

        $user->update($validated);
        return response()->json($user);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->email === 'admin@journaltracker.app') {
            abort(403, 'Không thể xóa tài khoản quản trị tối cao.');
        }

        if (strtolower($user->role) === 'admin' && $request->user()->email !== 'admin@journaltracker.app') {
            abort(403, 'Chỉ tài khoản admin gốc mới được phép xóa Admin khác.');
        }

        $user->delete();
        return response()->json(null, 204);
    }
}
