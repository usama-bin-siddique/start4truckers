<?php

namespace App\Http\Controllers;

use App\Models\CrmNotification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notificationService) {}

    public function index(): Response
    {
        $userId = Auth::id();

        return Inertia::render('Notifications/Index', [
            'notifications' => $this->notificationService->getRecent($userId, 50),
            'unread_count'  => $this->notificationService->getUnreadCount($userId),
        ]);
    }

    public function open(int $id): RedirectResponse
    {
        $notification = CrmNotification::where('user_id', Auth::id())->findOrFail($id);
        $notification->markAsRead();

        $url = $notification->data['url']
            ?? NotificationService::urlFor($notification->type, $notification->data ?? []);

        return $url
            ? redirect($url)
            : redirect()->route('notifications.index');
    }

    public function markAsRead(int $id): RedirectResponse
    {
        $this->notificationService->markAsRead($id, Auth::id());

        return back();
    }

    public function markAllAsRead(): RedirectResponse
    {
        $this->notificationService->markAllAsRead(Auth::id());

        return back()->with('success', 'All notifications marked as read.');
    }

    public function getUnreadCount(): JsonResponse
    {
        return response()->json([
            'count' => $this->notificationService->getUnreadCount(Auth::id()),
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $ids = $request->input('ids', []);
        abort_unless(is_array($ids) && count($ids) > 0, 422);
        CrmNotification::where('user_id', Auth::id())->whereIn('id', $ids)->delete();
        return back()->with('success', 'Selected notifications cleared.');
    }
}
