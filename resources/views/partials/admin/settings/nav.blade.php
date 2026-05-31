@section('settings::nav')
    <ul class="nav nav-tabs nav-tabs-alt mb-3">
        <li class="nav-item">
            <a class="nav-link{{ $activeTab === 'basic' ? ' active' : '' }}" href="{{ route('admin.settings') }}">
                <i class="ti ti-settings me-1"></i> General
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $activeTab === 'mail' ? ' active' : '' }}" href="{{ route('admin.settings.mail') }}">
                <i class="ti ti-mail me-1"></i> Mail
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $activeTab === 'advanced' ? ' active' : '' }}" href="{{ route('admin.settings.advanced') }}">
                <i class="ti ti-tool me-1"></i> Advanced
            </a>
        </li>
    </ul>
@endsection
