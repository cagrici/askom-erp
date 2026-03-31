@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>{{ __('Tag Details') }}</span>
                    <div>
                        <a href="{{ route('tags.edit', $tag) }}" class="btn btn-primary btn-sm mx-1">{{ __('Edit') }}</a>
                        <a href="{{ route('tags.index') }}" class="btn btn-secondary btn-sm mx-1">{{ __('Back to Tags') }}</a>
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
                            <h4>{{ $tag->name }}</h4>
                            <hr>
                            <p class="text-muted">
                                <strong>{{ __('Created:') }}</strong> {{ $tag->created_at->format('Y-m-d H:i') }}<br>
                                <strong>{{ __('Last Updated:') }}</strong> {{ $tag->updated_at->format('Y-m-d H:i') }}
                            </p>
                            
                            <h5 class="mt-4">{{ __('Description') }}</h5>
                            <p>{!! nl2br(e($tag->description)) !!}</p>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-12">
                            <h5>{{ __('Documents with this Tag') }}</h5>
                            
                            @if($tag->documents->count() > 0)
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>{{ __('Title') }}</th>
                                                <th>{{ __('Category') }}</th>
                                                <th>{{ __('Created At') }}</th>
                                                <th>{{ __('Actions') }}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach($tag->documents as $document)
                                                <tr>
                                                    <td>{{ $document->title }}</td>
                                                    <td>{{ $document->category->name }}</td>
                                                    <td>{{ $document->created_at->format('Y-m-d') }}</td>
                                                    <td>
                                                        <a href="{{ route('documents.show', $document) }}" class="btn btn-info btn-sm">{{ __('View') }}</a>
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            @else
                                <p class="text-muted">{{ __('No documents found with this tag.') }}</p>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
