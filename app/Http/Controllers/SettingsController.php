<?php

namespace App\Http\Controllers;

use App\Models\EmailTemplate;
use App\Models\Pricing;
use App\Models\Service;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    // ── Main settings page ────────────────────────────────────────────────
    public function index(): Response
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        \Log::info('Settings page accessed', ['user' => auth()->id()]);

        return Inertia::render('Settings/Index', [
            'users'     => User::orderBy('name')->get(['id', 'name', 'email', 'role', 'is_active']),
            'services'  => Service::orderBy('order')->with('pricing')->get(),
            'templates' => EmailTemplate::orderBy('name')->get(),
            'settings'  => Setting::pluck('value', 'key'),
        ]);
    }

    // ── Users ─────────────────────────────────────────────────────────────
    public function storeUser(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', 'in:admin,sales,processing'],
        ]);

        User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'role'      => $data['role'],
            'is_active' => true,
        ]);

        return back()->with('success', 'User created.');
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'      => ['required', 'in:admin,sales,processing'],
            'is_active' => ['required', 'boolean'],
            'password'  => ['nullable', 'string', 'min:8'],
        ]);

        $update = [
            'name'      => $data['name'],
            'email'     => $data['email'],
            'role'      => $data['role'],
            'is_active' => $data['is_active'],
        ];

        if (!empty($data['password'])) {
            $update['password'] = Hash::make($data['password']);
        }

        $user->update($update);

        return back()->with('success', 'User updated.');
    }

    public function destroyUser(User $user): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();
        return back()->with('success', 'User deleted.');
    }

    // ── Services ──────────────────────────────────────────────────────────
    public function storeService(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'slug'        => ['required', 'string', 'max:100', 'unique:services,slug'],
            'description' => ['nullable', 'string'],
            'price'       => ['nullable', 'numeric', 'min:0'],
            'is_active'   => ['boolean'],
            'order'       => ['integer', 'min:0'],
        ]);

        $service = Service::create([
            'name'        => $data['name'],
            'slug'        => $data['slug'],
            'description' => $data['description'] ?? null,
            'is_active'   => $data['is_active'] ?? true,
            'order'       => $data['order'] ?? 99,
        ]);

        if (!empty($data['price'])) {
            Pricing::create(['service_id' => $service->id, 'amount' => $data['price']]);
        }

        return back()->with('success', 'Service created.');
    }

    public function updateService(Request $request, Service $service): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price'       => ['nullable', 'numeric', 'min:0'],
            'is_active'   => ['boolean'],
            'order'       => ['integer', 'min:0'],
        ]);

        $service->update([
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active'   => $data['is_active'] ?? true,
            'order'       => $data['order'] ?? $service->order,
        ]);

        if (isset($data['price'])) {
            Pricing::updateOrCreate(
                ['service_id' => $service->id],
                ['amount' => $data['price']]
            );
        }

        return back()->with('success', 'Service updated.');
    }

    public function destroyService(Service $service): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');
        $service->delete();
        return back()->with('success', 'Service deleted.');
    }

    // ── Email Templates ───────────────────────────────────────────────────
    public function storeTemplate(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $data = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'slug'    => ['required', 'string', 'max:100', 'unique:email_templates,slug'],
            'subject' => ['required', 'string', 'max:255'],
            'body'    => ['required', 'string'],
        ]);

        EmailTemplate::create($data);
        return back()->with('success', 'Email template created.');
    }

    public function updateTemplate(Request $request, EmailTemplate $template): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $data = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'body'    => ['required', 'string'],
        ]);

        $template->update($data);
        return back()->with('success', 'Template updated.');
    }

    public function destroyTemplate(EmailTemplate $template): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');
        $template->delete();
        return back()->with('success', 'Template deleted.');
    }

    // ── General & API Settings ────────────────────────────────────────────
    public function updateSettings(Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $data = $request->validate([
            'company_name'     => ['nullable', 'string', 'max:255'],
            'company_email'    => ['nullable', 'email'],
            'company_phone'    => ['nullable', 'string', 'max:30'],
            'web3forms_key'    => ['nullable', 'string', 'max:255'],
            'web3forms_secret' => ['nullable', 'string', 'max:255'],
            'stripe_key'       => ['nullable', 'string', 'max:255'],
            'stripe_secret'    => ['nullable', 'string', 'max:255'],
        ]);

        $groups = [
            'company_name'     => 'general',
            'company_email'    => 'general',
            'company_phone'    => 'general',
            'web3forms_key'    => 'api',
            'web3forms_secret' => 'api',
            'stripe_key'       => 'api',
            'stripe_secret'    => 'api',
        ];

        foreach ($data as $key => $value) {
            Setting::set($key, $value ?? '', $groups[$key] ?? 'general');
        }

        return back()->with('success', 'Settings saved.');
    }
}
