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
            <a class="nav-link{{ $activeTab === 'security' ? ' active' : '' }}" href="{{ route('admin.settings.security') }}">
                <i class="ti ti-shield me-1"></i> Security
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $activeTab === 'oauth' ? ' active' : '' }}" href="{{ route('admin.settings.oauth') }}">
                <i class="ti ti-key me-1"></i> OAuth
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $activeTab === 'mappings' ? ' active' : '' }}" href="{{ route('admin.settings.mappings') }}">
                <i class="ti ti-category me-1"></i> Mappings
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link{{ $activeTab === 'advanced' ? ' active' : '' }}" href="{{ route('admin.settings.advanced') }}">
                <i class="ti ti-tool me-1"></i> Advanced
            </a>
        </li>
    </ul>
@endsection
