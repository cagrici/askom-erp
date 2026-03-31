@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>{{ __('Document Details') }}</span>
                    <div>
                        <a href="{{ route('documents.edit', $document) }}" class="btn btn-primary btn-sm mx-1">{{ __('Edit') }}</a>
                        @if($document->file_path)
                            <a href="{{ route('documents.download', $document) }}" class="btn btn-success btn-sm mx-1">{{ __('Download File') }}</a>
                        @endif
                        <a href="{{ route('documents.index') }}" class="btn btn-secondary btn-sm mx-1">{{ __('Back to Documents') }}</a>
                    </div>
                </div>

                <div class="card-body">
                    @if (session('success'))
                        <div class="alert alert-success" role="alert">
                            {{ session('success') }}
                        </div>
                    @endif

                    <div class="row mb-4">
                        <div class="col-md-12">
                            <h3>{{ $document->title }}</h3>
                            <hr>
                            <p class="text-muted">
                                <strong>{{ __('Category:') }}</strong> {{ $document->category->name }}<br>
                                <strong>{{ __('Created:') }}</strong> {{ $document->created_at->format('Y-m-d H:i') }}<br>
                                <strong>{{ __('Last Updated:') }}</strong> {{ $document->updated_at->format('Y-m-d H:i') }}
                            </p>
                            
                            @if($document->tags->count() > 0)
                                <div class="mb-3">
                                    <strong>{{ __('Tags:') }}</strong>
                                    @foreach($document->tags as $tag)
                                        <a href="{{ route('tags.show', $tag) }}" class="badge bg-primary text-decoration-none">{{ $tag->name }}</a>
                                    @endforeach
                                </div>
                            @endif
                            
                            @if($document->file_path)
                                <div class="mb-3">
                                    <strong>{{ __('Attachment:') }}</strong>
                                    <a href="{{ route('documents.download', $document) }}">{{ basename($document->file_path) }}</a>
                                </div>
                            @endif
                            
                            <h5 class="mt-4">{{ __('Content') }}</h5>
                            <div class="p-3 bg-light rounded">
                                {!! nl2br(e($document->content)) !!}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
