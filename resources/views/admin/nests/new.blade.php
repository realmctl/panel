@extends('layouts.admin')

@section('title')
    New Nest
@endsection

@section('content-header')
    <h2 class="page-title">New Nest</h2>
@endsection

@section('admin-content')
<form action="{{ route('admin.nests.new') }}" method="POST">
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">New Nest</h3>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Name</label>
                        <div>
                            <input type="text" name="name" class="form-control" value="{{ old('name') }}" />
                            <span class="form-hint">This should be a descriptive category name that encompasses all of the eggs within the nest.</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <div>
                            <textarea name="description" class="form-control" rows="6">{{ old('description') }}</textarea>
                        </div>
                    </div>
                </div>
                <div class="card-footer d-flex justify-content-end">
                    {!! csrf_field() !!}
                    <button type="submit" class="btn btn-primary"><i class="ti ti-device-floppy me-1"></i> Save</button>
                </div>
            </div>
        </div>
    </div>
</form>
@endsection
