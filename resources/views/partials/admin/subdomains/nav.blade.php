<ul class="nav nav-tabs nav-tabs-alt mb-3">
    <li class="nav-item">
        <a class="nav-link{{ ($activeTab ?? 'domains') === 'domains' ? ' active' : '' }}" href="{{ route('admin.subdomains.index') }}">
            <i class="ti ti-world me-1"></i> Domains
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link{{ ($activeTab ?? '') === 'records' ? ' active' : '' }}" href="{{ route('admin.subdomains.records.index') }}">
            <i class="ti ti-template me-1"></i> Record Templates
        </a>
    </li>
</ul>
