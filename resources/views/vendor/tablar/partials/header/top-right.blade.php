@auth
    <div class="nav-item dropdown">
        <a href="#" class="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown"
           aria-label="Open user menu">
            <span class="avatar avatar-sm" style="background-image: url(https://www.gravatar.com/avatar/{{ md5(strtolower(Auth::user()->email)) }}?s=80)"></span>
            <div class="d-none d-xl-block ps-2">
                <div>{{ Auth::user()->name_first }} {{ Auth::user()->name_last }}</div>
            </div>
        </a>
        <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
            <a href="{{ route('account') }}" class="dropdown-item">
                <i class="ti ti-user me-2"></i> Account
            </a>
            <a href="/admin/settings" class="dropdown-item">
                <i class="ti ti-settings me-2"></i> Settings
            </a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item" href="#" onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                <i class="ti ti-logout me-2"></i> Logout
            </a>
            <form id="logout-form" action="{{ route('auth.logout') }}" method="POST" style="display: none;">
                {{ csrf_field() }}
            </form>
        </div>
    </div>
@endif
