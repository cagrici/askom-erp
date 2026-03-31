@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>{{ __('Documents') }}</span>
                    <a href="{{ route('documents.create') }}" class="btn btn-primary btn-sm">{{ __('Create New Document') }}</a>
                </div>

                <div class="card-body">
                    @if (session('success'))
                        <div class="alert alert-success" role="alert">
                            {{ session('success') }}
                        </div>
                    @endif

                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>{{ __('ID') }}</th>
                                    <th>{{ __('Title') }}</th>
                                    <th>{{ __('Category') }}</th>
                                    <th>{{ __('Tags') }}</th>
                                    <th>{{ __('Created At') }}</th>
                                    <th>{{ __('Actions') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse ($documents as $document)
                                    <tr>
                                        <td>{{ $document->id }}</td>
                                        <td>{{ $document->title }}</td>
                                        <td>{{ $document->category->name }}</td>
                                        <td>
                                            @foreach($document->tags as $tag)
                                                <span class="badge bg-primary">{{ $tag->name }}</span>
                                            @endforeach
                                        </td>
                                        <td>{{ $document->created_at->format('Y-m-d') }}</td>
                                        <td>
                                            <div class="btn-group" role="group">
                                                <a href="{{ route('documents.show', $document) }}" class="btn btn-info btn-sm">{{ __('View') }}</a>
                                                <a href="{{ route('documents.edit', $document) }}" class="btn btn-primary btn-sm">{{ __('Edit') }}</a>
                                                <form action="{{ route('documents.destroy', $document) }}" method="POST" onsubmit="return confirm('{{ __('Are you sure you want to delete this document?') }}');" style="display: inline-block;">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="btn btn-danger btn-sm">{{ __('Delete') }}</button>
                                                </form>
                                                @if($document->file_path)
                                                    <a href="{{ route('documents.download', $document) }}" class="btn btn-success btn-sm">{{ __('Download') }}</a>
                                                @endif
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="6" class="text-center">{{ __('No documents found.') }}</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
