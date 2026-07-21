<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('email', '!=', 'admin@journaltracker.app');

        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', '%' . $search . '%')
                  ->orWhere('email', 'ilike', '%' . $search . '%');
            });
        }

        $statsQuery = User::where('email', '!=', 'admin@journaltracker.app')
            ->selectRaw('role, count(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role');

        $perPage = $request->input('per_page', 10);
        $users = $query->latest()->paginate($perPage);

        return response()->json([
            'users' => $users,
            'stats' => $statsQuery
        ]);
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
