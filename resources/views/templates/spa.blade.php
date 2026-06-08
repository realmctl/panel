@extends('templates/wrapper', [
    'css' => $css ?? ['body' => '', 'bodyStyle' => 'background-color: #0b0f10;'],
])

@section('container')
    @if ($withModalPortal ?? false)
        <div id="modal-portal"></div>
    @endif
    <div id="app"></div>
@endsection
