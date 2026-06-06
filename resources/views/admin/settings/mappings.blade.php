@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'mappings'])

@section('title')
    Egg Mappings
@endsection

@section('content-header')
    <h2 class="page-title">Egg Mappings</h2>
@endsection

@section('admin-content')
    @yield('settings::nav')

    <div class="alert alert-info mb-3">
        <div class="d-flex">
            <div class="pe-2 pt-1">
                <i class="ti ti-info-circle"></i>
            </div>
            <div>
                <div class="fw-semibold mb-1">Category mappings control panel features</div>
                <div class="text-secondary">
                    Assign eggs to a category to enable features for those servers only. Minecraft-mapped eggs unlock the
                    plugin installer, version changer, and player manager.
                </div>
            </div>
        </div>
    </div>

    <form action="{{ route('admin.settings.mappings') }}" method="POST">
        @foreach($categories as $categoryKey => $category)
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">
                        @if(!empty($category['icon']))
                            <i class="{{ $category['icon'] }} me-2"></i>
                        @endif
                        {{ $category['label'] ?? $categoryKey }}
                    </h3>
                </div>
                <div class="card-body">
                    @if(!empty($category['description']))
                        <p class="text-secondary mb-3">{{ $category['description'] }}</p>
                    @endif

                    @if(!empty($category['features']))
                        <div class="mb-3">
                            @foreach($category['features'] as $feature)
                                <span class="badge bg-blue-lt me-1">{{ $feature }}</span>
                            @endforeach
                        </div>
                    @endif

                    <div class="row">
                        @forelse($nests as $nest)
                            @if($nest->eggs->isEmpty())
                                @continue
                            @endif

                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="border rounded p-3 h-100">
                                    <div class="fw-semibold mb-2">{{ $nest->name }}</div>
                                    <div class="d-flex flex-column gap-2">
                                        @foreach($nest->eggs->sortBy('name') as $egg)
                                            @php
                                                $checked = in_array($egg->id, $mappings[$categoryKey] ?? [], true);
                                            @endphp
                                            <label class="form-check">
                                                <input
                                                    class="form-check-input"
                                                    type="checkbox"
                                                    name="mappings[{{ $categoryKey }}][]"
                                                    value="{{ $egg->id }}"
                                                    @if($checked) checked @endif
                                                />
                                                <span class="form-check-label">{{ $egg->name }}</span>
                                            </label>
                                        @endforeach
                                    </div>
                                </div>
                            </div>
                        @empty
                            <div class="col-12">
                                <p class="text-secondary mb-0">No nests or eggs found.</p>
                            </div>
                        @endforelse
                    </div>
                </div>
            </div>
        @endforeach

        <div class="text-end">
            {!! csrf_field() !!}
            <button type="submit" name="_method" value="PATCH" class="btn btn-primary">
                <i class="ti ti-device-floppy me-1"></i> Save Mappings
            </button>
        </div>
    </form>
@endsection
